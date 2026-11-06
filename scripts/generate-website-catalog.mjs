import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, posix } from 'node:path';
import ts from 'typescript';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const readJson = (path) => JSON.parse(read(path));

// The website orders components by the task people use them for.
const groups = {
  基础控件: {
    MButton: '触发提交或操作，支持三种强调层级、尺寸和加载状态。',
    MIcon: '用统一线条的 SVG 图标表达动作，也可提供自定义路径。',
    MTypography: '排版标题和段落，支持文本编辑、复制与截断。',
    MText: '在行内展示正文、辅助文字或带语义的强调文本。',
    MLink: '通过原生链接进入页面或外部资源。',
    MDivider: '用横向墨线分隔内容区块，可在分隔线中加入标签。',
  },
  表单与选择: {
    MInput: '录入单行文本，配合标签、提示、错误和原生表单属性。',
    MTextarea: '编辑多行内容，适合备注、说明和较长文本。',
    MInputNumber: '输入或逐步调节数值，支持边界、小数步长和空值。',
    MSlider: '沿刻度调节有范围的数值，支持键盘和触控。',
    MSelect: '从固定选项中选择一个值，保留原生表单语义。',
    MCombobox: '输入关键词过滤候选，再用键盘或鼠标选择。',
    MAutoComplete: '边输入边查看建议，并保留自行填写文本的能力。',
    MVirtualSelect: '在较长的选项列表中搜索和选择，支持单选与多选。',
    MCheckbox: '切换一个独立选项，可展示混合选中状态。',
    MCheckboxGroup: '从一组选项中多选，可设最少与最多选择数。',
    MRadio: '以原生单选控件加入同一表单组。',
    MRadioGroup: '在互斥选项中确认单一值，可随表单提交。',
    MSwitch: '开启或关闭一项设置，保留原生开关交互。',
    MSegmented: '在少量互斥模式间切换，滑轨跟随已选项。',
    MCascader: '沿分级选项选择完整路径，支持搜索和多路径。',
    MTreeSelect: '在可筛选的树中选择节点，适合层级目录和归属字段。',
    MColorPicker: '从弹出面板调色，支持十六进制、透明度和预设。',
    MColorPickerPanel: '将调色区域和预设色板嵌入页面，直接编辑颜色。',
    MRate: '按整格或半格评分，支持键盘调整。',
    MTransfer: '在可搜索的左右清单间移动选中项。',
    MInputOTP: '分格录入短验证码，支持整体粘贴和退格编辑。',
    MInputTag: '把输入转成可移除标签，可限制数量或重复项。',
    MMention: '用 @ 等前缀唤起候选，把选中项插入当前文本。',
    MUpload: '选择或拖入附件，管理文件约束、上传进度和取消。',
    MForm: '组织受控字段，提供规则校验、错误定位和重置。',
    MFormItem: '把字段名、标签和验证状态接到表单控件上。',
    MFormList: '增删、重排表单数组项，管理动态字段路径。',
  },
  日期与时间: {
    MDatePicker: '输入 ISO 日期或打开历盘选择日期，支持可选范围。',
    MDateRangePicker: '选择起止日期，校验先后顺序与可选边界。',
    MDateTimePicker: '在同一字段中编辑日期与时间，支持范围和时间步长。',
    MTimePicker: '输入时间或从时分选项中选取符合步长的值。',
    MTimeSelect: '根据起止时间和步长提供固定时间选项。',
    MDatePickerPanel: '在页面内直接使用可键盘操作的月份日期网格。',
    MCalendar: '按月展示日期，支持选日和自定义日期单元内容。',
  },
  导航: {
    MTabs: '在并列内容面板间切换，支持键盘和手动激活。',
    MMenu: '组织可折叠的多级导航，区分焦点与当前选中项。',
    MDropdownMenu: '把次要操作收进可用键盘控制的弹出菜单。',
    MBreadcrumb: '展示页面所在的层级路径，并链接到上层页面。',
    MPagination: '按记录总量和每页大小提供分页导航。',
    MSteps: '标明当前流程步骤以及完成、进行中和异常状态。',
    MAnchor: '构建页内目录，滚动时标记当前章节。',
    MAffix: '将工具栏或目录固定在指定滚动范围内。',
    MPageHeader: '组合页面标题、副标题、返回入口和操作区。',
    MBackTop: '在长页或独立滚动容器中提供回顶操作。',
    MFloatButton: '在内容旁提供固定的快捷操作或链接。',
    MFloatButtonGroup: '把多项浮动操作组合成可展开的快捷入口。',
    MTour: '围绕实际界面目标逐步引导用户认识操作。',
  },
  反馈与浮层: {
    MDialog: '打开模态内容，管理键盘焦点、取消和关闭。',
    MDrawer: '从页面边缘展开详情或编辑流程，关闭后交还焦点。',
    MPopover: '在触发元素旁展示可交互的浮层内容。',
    MTooltip: '在指针悬停或键盘聚焦时补充简短提示。',
    MPopconfirm: '在操作旁请求确认，可等待异步检查再提交。',
    MMessageBox: '用对话框呈现提醒、确认或带校验的输入请求。',
    MToast: '展示单条通知，可在悬停或聚焦时暂停消失计时。',
    MToastViewport: '为一组通知提供统一摆放位置和主题范围。',
    MMessage: '在页面顶部给出短反馈，可从加载切换到结果。',
    MAlert: '在内容流中持续显示信息、成功、警告或错误。',
    MResult: '用页面级标题、状态图形和操作呈现流程结果。',
    MEmpty: '为暂无数据或搜索无结果提供说明和可选操作。',
    MSpinner: '用机械墨刻形态表示等待中的任务。',
    MSkeleton: '在加载时按内容结构预留空间。',
    MLoading: '在指定区域或全屏显示等待遮层，支持延迟和取消操作。',
    MProgress: '展示任务进度或未知进度，并明确区分错误与完成。',
  },
  数据展示: {
    MCard: '用标题、内容和操作承载一组相关信息。',
    MTable: '按列展示结构化记录，支持自定义单元格和空态。',
    MVirtualTable: '用虚拟滚动浏览大量表格行。',
    MTree: '浏览多级目录，支持展开、选择与复选联动。',
    MVirtualTree: '在长层级树中按可视范围渲染节点。',
    MList: '以插槽定制每项内容，适合普通记录清单。',
    MListy: '以编号或原有索引展示清单，支持长列表。',
    MVirtualList: '在固定或可测高度的视口中渲染长清单。',
    MInfiniteScroll: '靠近列表末尾时请求下一批记录，并展示加载状态。',
    MDescriptions: '以名称和值对展示档案详情和只读资料。',
    MStatistic: '用醒目的值和单位展示指标，支持前后缀和占位。',
    MTimeline: '按时间或执行顺序展示事件及状态。',
    MTag: '标记分类、属性或已选条件，可提供移除操作。',
    MBadge: '为对象添加带语义色的短状态标记。',
    MAvatar: '展示用户图像、姓名缩写或缺省头像。',
    MImage: '展示图片和加载回退，并提供可操作的预览。',
    MQRCode: '把文字或链接编码成可扫的墨刻二维码，支持导出。',
    MCarousel: '在同一展示区域轮换图片或内容面板。',
  },
  布局与呈现: {
    MSpace: '以统一间距排列控件，可换行或插入分隔。',
    MGrid: '按响应式列数和间距排列页面内容。',
    MGridItem: '设置内容占用的网格列数和偏移。',
    MFlex: '沿横向或纵向排列子项，并控制对齐、间距和换行。',
    MLayout: '用头部、侧栏、正文和底部组织页面。',
    MSplitter: '让用户拖动或用键盘调节相邻面板的尺寸。',
    MMasonry: '按列承载高度不同的卡片，可随屏宽调整列数。',
    MAccordion: '按需展开分组内容，适合说明、问题或设置项。',
    MScrollbar: '为独立滚动区域提供与主题一致的滚动条。',
    MWatermark: '在内容区域重复铺设文字或图片水印。',
    MBorderBeam: '用沿边框移动的光迹强调当前展示区域。',
  },
  应用配置: {
    MConfigProvider: '为子树集中配置主题、配色、密度、动效、语言和方向。',
    MApp: '在独立应用范围内统一管理消息、通知和消息框。',
  },
};

// Some components are exercised in another component's stories.
const shared = {
  MConfigProvider: ['配置提供器', '配置-app-应用上下文--scoped'],
  MFormItem: ['表单字段', '基础组件-form-表单--default'],
  MIcon: ['图标', '基础组件-typography-文字--icons'],
  MLink: ['链接', '基础组件-typography-文字--editing'],
  MLoading: ['加载遮层', '配置-app-应用上下文--loading'],
  MMessageBox: ['消息框', '配置-app-应用上下文--default'],
  MText: ['行内文本', '基础组件-typography-文字--editing'],
  MToastViewport: ['通知容器', '基础组件-toast-轻提示--positions'],
};

const storyLabels = {
  Default: '基础用法', Boundary: '边界状态', WindowDefault: '页面回顶', Disabled: '禁用', Loading: '加载',
  ReducedMotion: '减少动态效果', Scoped: '局部配置', Icons: '图标列表', Editing: '文本与链接', Positions: '通知位置',
};

function collectComponents(path, components, visited = new Set()) {
  if (visited.has(path)) return;
  visited.add(path);
  const source = ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true);
  for (const node of source.statements) {
    if (!ts.isExportDeclaration(node) || node.isTypeOnly || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue;
    const target = posix.normalize(posix.join(posix.dirname(path), node.moduleSpecifier.text));
    if (target.endsWith('.vue') && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const specifier of node.exportClause.elements) {
        if (!specifier.isTypeOnly) components.set(specifier.name.text, target);
      }
    } else if (!node.exportClause && node.moduleSpecifier.text.startsWith('.')) {
      collectComponents(`${target}/index.ts`, components, visited);
    }
  }
}

const publicComponents = new Map();
collectComponents('src/components.ts', publicComponents);
const entries = Object.values(readJson('storybook-static/index.json').entries);
const storiesByFile = Map.groupBy(entries, (entry) => entry.importPath);
const storiesById = new Map(entries.map((entry) => [entry.id, entry]));
const capabilityGroups = readJson('design/component-coverage.json').items;
const parity = readJson('design/component-parity.json').entries;

const catalog = [];
for (const [category, group] of Object.entries(groups)) {
  for (const [name, description] of Object.entries(group)) {
    const source = publicComponents.get(name);
    if (!source) throw new Error(`Unknown website component: ${name}`);
    const [overrideLabel, overrideId] = shared[name] ?? [];
    const groupEntries = overrideId
      ? storiesByFile.get(storiesById.get(overrideId)?.importPath)
      : entries.filter((entry) => posix.basename(entry.importPath) === `${name.slice(1)}.stories.ts`);
    const componentStories = groupEntries?.filter((entry) => entry.type === 'story') ?? [];
    const defaultStory = overrideId
      ? componentStories.find((entry) => entry.id === overrideId)
      : componentStories.find((entry) => entry.exportName === 'Default') ?? componentStories[0];
    if (!defaultStory) throw new Error(`Missing Storybook story for ${name}. Run pnpm build:storybook first.`);
    const title = defaultStory.title.split('/').at(-1);
    const label = overrideLabel ?? title.slice(title.indexOf(' ') + 1);
    const docsId = overrideId ? undefined : groupEntries.find((entry) => entry.type === 'docs')?.id;
    const aliases = [
      name.slice(1),
      name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/^M/, 'm-').toLowerCase(),
      ...capabilityGroups.filter((item) => item.components.includes(name)).map((item) => item.capability),
      ...parity.filter((item) => item.components.includes(name)).map((item) => item.name),
    ];
    catalog.push({
      name, label, category, description, keywords: [...new Set(aliases)], source,
      storyId: defaultStory.id, docsId,
      stories: (overrideId ? [defaultStory] : componentStories).map((entry) => ({ id: entry.id, label: storyLabels[entry.name] ?? entry.name })),
    });
  }
}

const names = new Set(catalog.map((item) => item.name));
const missing = [...publicComponents.keys()].filter((name) => !names.has(name));
if (missing.length || names.size !== catalog.length) throw new Error(`Incomplete catalog. Missing: ${missing.join(', ')}`);
const output = new URL('website/src/data/components.json', root);
mkdirSync(new URL('.', output), { recursive: true });
writeFileSync(output, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${catalog.length} public components with ${catalog.filter((item) => item.docsId).length} dedicated API pages.`);
