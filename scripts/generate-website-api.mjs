import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { compileScript, parse } from 'vue/compiler-sfc';

const root = fileURLToPath(new URL('../', import.meta.url));
const target = resolve(root, 'website/src/data/api.json');
const catalog = JSON.parse(readFileSync(resolve(root, 'website/src/data/components.json'), 'utf8'));
const virtualFiles = new Map();
const entries = new Map();
const portablePath = path => path.replaceAll('\\', '/');
const compilerFs = {
  fileExists: existsSync,
  readFile: filename => existsSync(filename) ? readFileSync(filename, 'utf8') : undefined,
};
const descriptions = {
  MButton: {
    variant: '操作强调层级',
    size: '控件尺寸',
    type: '原生按钮类型',
    disabled: '禁用按钮',
    loading: '显示加载标记并阻止重复点击',
  },
  MInput: {
    modelValue: '输入框的受控文本',
    id: '原生输入框 ID',
    label: '可见字段标签',
    hint: '补充说明',
    error: '错误说明并标记输入无效',
    type: '原生输入类型',
    disabled: '禁用输入',
  },
};

for (const item of catalog) {
  if (entries.has(item.name)) throw new Error(`Duplicate catalog component: ${item.name}`);
  const filename = portablePath(resolve(root, item.source));
  if (relative(root, filename).startsWith('..') || !filename.endsWith('.vue')) {
    throw new Error(`Invalid catalog source: ${item.source}`);
  }
  const { descriptor, errors } = parse(readFileSync(filename, 'utf8'), { filename });
  if (errors.length) throw new Error(`Cannot parse ${item.source}: ${errors.map(error => error.message ?? error).join('; ')}`);
  const virtual = filename + '.api.ts';
  virtualFiles.set(virtual, [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join('\n'));
  entries.set(item.name, { descriptor, virtual, source: item.source });
}

// Resolve the same local imports and mapped/intersection types as TypeScript.
// Virtual sources stay beside the real SFC paths so their imports keep their scope.
const options = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  types: [],
};
const host = ts.createCompilerHost(options);
const getSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (name, languageVersion, ...args) => {
  const content = virtualFiles.get(portablePath(name));
  return content === undefined
    ? getSourceFile(name, languageVersion, ...args)
    : ts.createSourceFile(name, content, languageVersion, true, ts.ScriptKind.TS);
};
const program = ts.createProgram([...virtualFiles.keys()], options, host);
const checker = program.getTypeChecker();

function unwrap(node) {
  while (node && ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
}

function keyOf(node) {
  if (node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node))) return node.text;
  return undefined;
}

function property(object, key) {
  if (!object || !ts.isObjectLiteralExpression(object)) return undefined;
  return object.properties.find(node => ts.isPropertyAssignment(node) && keyOf(node.name) === key)?.initializer;
}

function macro(sourceFile, name) {
  let found;
  function visit(node) {
    if (found) return;
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === name) found = node;
    else ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function componentOptions(sourceFile) {
  const exported = sourceFile.statements.find(node => ts.isExportAssignment(node) && !node.isExportEquals);
  const expression = unwrap(exported?.expression);
  if (expression && ts.isObjectLiteralExpression(expression)) return expression;
  const argument = expression && ts.isCallExpression(expression) ? unwrap(expression.arguments[0]) : undefined;
  if (argument && ts.isObjectLiteralExpression(argument)) return argument;
  throw new Error('无法解析组件选项');
}

function getTypedMembers(typeNode) {
  if (!typeNode) return [];
  return checker.getPropertiesOfType(checker.getTypeFromTypeNode(typeNode));
}

function declarationOf(symbol) {
  return symbol?.declarations?.find(declaration => 'type' in declaration) ?? symbol?.valueDeclaration;
}

function simpleUnion(typeNode) {
  if (!typeNode || !ts.isTypeReferenceNode(typeNode) || typeNode.typeArguments?.length) return undefined;
  let symbol = checker.getSymbolAtLocation(typeNode.typeName);
  if (symbol && (symbol.flags & ts.SymbolFlags.Alias)) symbol = checker.getAliasedSymbol(symbol);
  const alias = symbol?.declarations?.find(ts.isTypeAliasDeclaration);
  if (!alias || !ts.isUnionTypeNode(alias.type)) return undefined;
  const keywords = [ts.SyntaxKind.StringKeyword, ts.SyntaxKind.NumberKeyword, ts.SyntaxKind.BooleanKeyword, ts.SyntaxKind.UndefinedKeyword];
  if (!alias.type.types.every(type => ts.isLiteralTypeNode(type) || keywords.includes(type.kind))) return undefined;
  return alias.type.getText();
}

const runtimeTypes = {
  String: 'string', Number: 'number', Boolean: 'boolean', Array: 'unknown[]',
  Object: 'object', Function: 'Function', Date: 'Date', Symbol: 'symbol', null: 'unknown',
};

function runtimeType(node) {
  const value = unwrap(node);
  if (!value) return 'unknown';
  if (ts.isAsExpression(value) || ts.isTypeAssertionExpression(value)) {
    const annotation = value.type;
    if (ts.isTypeReferenceNode(annotation) && annotation.typeName.getText() === 'PropType' && annotation.typeArguments?.length === 1) {
      return annotation.typeArguments[0].getText();
    }
    return runtimeType(value.expression);
  }
  if (ts.isArrayLiteralExpression(value)) {
    return value.elements.map(item => item.kind === ts.SyntaxKind.NullKeyword ? 'null' : runtimeType(item)).join(' | ');
  }
  return runtimeTypes[value.getText()] ?? value.getText();
}

function runtimeExpression(node) {
  let value = unwrap(node);
  while (value && (ts.isAsExpression(value) || ts.isTypeAssertionExpression(value))) value = unwrap(value.expression);
  return value;
}

function constructors(node) {
  const value = runtimeExpression(node);
  if (!value) return [];
  if (ts.isArrayLiteralExpression(value)) return value.elements.flatMap(constructors);
  return [value.getText()];
}

function formatDefault(node, acceptsFunction) {
  if (!acceptsFunction && ts.isArrowFunction(node) && !node.parameters.length) {
    const body = unwrap(node.body);
    if (body && (ts.isObjectLiteralExpression(body) || ts.isArrayLiteralExpression(body))) return body.getText();
  }
  return node.getText();
}

function readProps(optionsNode, source, componentName) {
  const typedNode = macro(source, 'defineProps')?.typeArguments?.[0];
  const typed = new Map(getTypedMembers(typedNode).map(symbol => [symbol.getName(), symbol]));
  const runtime = property(optionsNode, 'props');
  if (!runtime) {
    if (typed.size) throw new Error('类型声明存在，但 Vue 未生成 Props');
    return [];
  }
  if (ts.isArrayLiteralExpression(runtime)) {
    return runtime.elements.map(element => {
      if (!ts.isStringLiteral(element)) throw new Error('无法解析运行时 Prop 名称');
      return { name: element.text, type: 'unknown', required: false };
    });
  }
  if (!ts.isObjectLiteralExpression(runtime)) throw new Error('无法解析运行时 Props 对象');
  const known = new Set();
  const rows = runtime.properties.map(node => {
    const name = keyOf(node.name);
    if (!name || !ts.isPropertyAssignment(node)) throw new Error('无法解析运行时 Prop 声明');
    known.add(name);
    const symbol = typed.get(name);
    const declaration = declarationOf(symbol);
    const annotation = declaration && 'type' in declaration ? declaration.type : undefined;
    const runtimeOptions = unwrap(node.initializer);
    const typeNode = ts.isObjectLiteralExpression(runtimeOptions) ? property(runtimeOptions, 'type') : runtimeOptions;
    const required = property(runtimeOptions, 'required')?.kind === ts.SyntaxKind.TrueKeyword;
    const declaredDefault = property(runtimeOptions, 'default');
    const runtimeConstructors = constructors(typeNode);
    const keepDefaultFunction = runtimeExpression(typeNode)?.getText() === 'Function' ||
      property(runtimeOptions, 'skipFactory')?.kind === ts.SyntaxKind.TrueKeyword;
    const defaultValue = declaredDefault
      ? formatDefault(declaredDefault, keepDefaultFunction)
      : !required && runtimeConstructors.includes('Boolean') ? 'false' : undefined;
    const sourceDescription = symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim() : '';
    const description = sourceDescription || descriptions[componentName]?.[name];
    const expandedType = simpleUnion(annotation);
    if (typedNode && !annotation) throw new Error(`无法解析 ${name} 的 TypeScript 类型`);
    return {
      name,
      type: annotation?.getText() ?? runtimeType(typeNode),
      required,
      ...(defaultValue === undefined ? {} : { defaultValue }),
      ...(description ? { description } : {}),
      ...(expandedType ? { expandedType } : {}),
    };
  });
  for (const name of typed.keys()) if (!known.has(name)) throw new Error(`类型声明中的 ${name} 没有运行时 Prop`);
  return rows;
}

function readEvents(optionsNode, source) {
  const typeNode = macro(source, 'defineEmits')?.typeArguments?.[0];
  const typed = new Map();
  for (const symbol of getTypedMembers(typeNode)) {
    const declaration = declarationOf(symbol);
    if (declaration && 'type' in declaration && declaration.type) typed.set(symbol.getName(), declaration.type.getText());
  }
  if (typeNode) {
    const eventType = checker.getTypeFromTypeNode(typeNode);
    for (const signature of checker.getSignaturesOfType(eventType, ts.SignatureKind.Call)) {
      const [name, ...payload] = signature.declaration?.parameters ?? [];
      if (!name?.type) continue;
      const names = ts.isUnionTypeNode(name.type) ? name.type.types : [name.type];
      for (const type of names) {
        if (!ts.isLiteralTypeNode(type) || !ts.isStringLiteral(type.literal)) continue;
        const value = `[${payload.map(parameter => parameter.getText()).join(', ')}]`;
        const previous = typed.get(type.literal.text);
        typed.set(type.literal.text, previous ? `${previous} | ${value}` : value);
      }
    }
  }
  const runtime = property(optionsNode, 'emits');
  if (!runtime) {
    if (typed.size) throw new Error('类型声明存在，但 Vue 未生成事件');
    return [];
  }
  if (ts.isArrayLiteralExpression(runtime)) {
    return runtime.elements.map(element => {
      if (!ts.isStringLiteral(element)) throw new Error('无法解析运行时事件名称');
      const type = typed.get(element.text);
      if (typeNode && !type) throw new Error(`无法解析 ${element.text} 的事件载荷`);
      return { name: element.text, type: type ?? 'unknown[]' };
    });
  }
  if (!ts.isObjectLiteralExpression(runtime)) throw new Error('无法解析运行时事件声明');
  return runtime.properties.map(node => {
    const name = keyOf(node.name);
    if (!name || !ts.isPropertyAssignment(node)) throw new Error('无法解析运行时事件名称');
    const validator = unwrap(node.initializer);
    const parameters = ts.isArrowFunction(validator) || ts.isFunctionExpression(validator) ? validator.parameters : undefined;
    return { name, type: typed.get(name) ?? (parameters ? `[${parameters.map(parameter => parameter.getText()).join(', ')}]` : 'unknown[]') };
  });
}

function readSlots(templateAst, source) {
  const names = new Map();
  function visit(node) {
    if (!node) return;
    if (node.tag === 'slot') {
      const name = node.props.find(prop => prop.name === 'name' && 'value' in prop);
      const binding = node.props.find(prop => prop.name === 'bind' && prop.arg?.isStatic && prop.arg.content === 'name');
      const dynamic = Boolean(binding?.exp?.content);
      const value = binding?.exp?.content ?? name?.value?.content ?? 'default';
      names.set(`${dynamic ? 'dynamic' : 'static'}:${value}`, { value, dynamic });
    }
    if (Array.isArray(node.children)) node.children.forEach(visit);
  }
  visit(templateAst);
  const slotsType = macro(source, 'defineSlots')?.typeArguments?.[0];
  const indexTypes = slotsType
    ? checker.getIndexInfosOfType(checker.getTypeFromTypeNode(slotsType))
      .map(info => info.declaration?.parameters[0]?.type)
      .filter(type => type && ts.isTemplateLiteralTypeNode(type))
    : [];
  const slots = [...names.values()];
  const oneDynamicSlot = slots.filter(slot => slot.dynamic).length === 1;
  const pattern = oneDynamicSlot && indexTypes.length === 1 ? indexTypes[0].getText().slice(1, -1) : undefined;
  return slots.map(({ value, dynamic }) => ({ name: dynamic ? `动态名称（${pattern ?? value}）` : value }));
}

const result = {};
for (const [name, entry] of entries) {
  try {
    const source = program.getSourceFile(entry.virtual);
    if (!source) throw new Error('虚拟 TypeScript 源码未加载');
    const slots = readSlots(entry.descriptor.template?.ast, source);
    if (!entry.descriptor.script && !entry.descriptor.scriptSetup) {
      result[name] = { props: [], events: [], slots };
      continue;
    }
    // Vue compilation supplies authoritative runtime defaults/Boolean casting,
    // while the original type nodes retain the consumer-facing annotations.
    const runtime = compileScript(entry.descriptor, { id: name, fs: compilerFs }).content;
    const runtimeSource = ts.createSourceFile(entry.virtual, runtime, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    const optionsNode = componentOptions(runtimeSource);
    result[name] = {
      props: readProps(optionsNode, source, name),
      events: readEvents(optionsNode, source),
      slots,
    };
  } catch (error) {
    throw new Error(`${name} (${entry.source}): ${error.message}`, { cause: error });
  }
}
writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(`Generated source API metadata for ${Object.keys(result).length} components.`);
