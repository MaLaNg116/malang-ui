import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const coverage = JSON.parse(fs.readFileSync(path.join(root, 'design/component-coverage.json'), 'utf8'));
const verified = process.argv.includes('--verified');
const exports = new Map();
for (const file of ['src/components.ts', ...['common', 'inputs', 'layout', 'data'].map(lane => `src/components/reference-${lane}/index.ts`)]) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of source.matchAll(/export\s*\{\s*default\s+as\s+(M\w+)\s*\}\s*from\s*['"]([^'"]+)['"]/g)) exports.set(match[1], path.relative(root, path.resolve(root, path.dirname(file), match[2])).replaceAll('\\', '/'));
}
const normalize = value => value.toLowerCase().replaceAll(/\s/g, '');
const special = {
  floatbutton: ['MFloatButton', 'MFloatButtonGroup', 'MBackTop'], typography: ['MTypography', 'MText', 'MLink'],
  grid: ['MGrid', 'MGridItem'], layoutcontainer: ['MLayout'], dropdown: ['MDropdownMenu'],
  autocomplete: ['MAutoComplete'], checkbox: ['MCheckbox', 'MCheckboxGroup'], radio: ['MRadio', 'MRadioGroup'],
  form: ['MForm', 'MFormItem', 'MFormList'], input: ['MInput', 'MTextarea', 'MInputOTP'],
  datepicker: ['MDatePicker', 'MDateRangePicker'], mentions: ['MMention'], mention: ['MMention'],
  select: ['MSelect', 'MCombobox', 'MVirtualSelect'], collapse: ['MAccordion'], modal: ['MDialog'], notification: ['MToast', 'MToastViewport', 'MApp'],
  message: ['MMessage', 'MApp'], spin: ['MSpinner'], loading: ['MLoading'],
  virtualizedselect: ['MVirtualSelect'], virtualizedtable: ['MVirtualTable'], virtualizedtree: ['MVirtualTree'],
  infinitescroll: ['MInfiniteScroll'], border: [], color: [], util: [],
  listy: ['MListy', 'MVirtualList'],
};
const criteria = {
  button: '原生按钮、状态、加载与禁用、键盘和焦点', floatbutton: '浮动操作与分组展开、点击/悬停触发、返回顶部', icon: 'SVG图标、尺寸颜色、自定义图形slot、可访问名称、减动',
  typography: '语义标题与段落、样式、复制/编辑/取消、截断展开', text: '行内文字与语义状态、截断', link: '真实链接、禁用、新窗口安全属性与原生修改键',
  divider: '横竖分隔与标题', flex: '方向、对齐、换行、间距', grid: '响应式列数、跨列与偏移', layout: '页面头/侧栏/内容/页脚分区', layoutcontainer: '页面头/侧栏/内容/页脚分区', masonry: '实测高度的最短列排布、容器重排、动态内容清理', space: '布局方向、间距、换行、分隔符', splitter: '真实指针拖动、键盘调整、受控尺寸、边界和折叠',
  anchor: '真实滚动目标定位、活动章节追踪、独立滚动容器', affix: '目标容器吸附、占位、滚动与观察器清理', breadcrumb: '当前位置与可导航祖先', dropdown: '菜单项/分隔/禁用、键盘、浮层定位与焦点返回', menu: '层级菜单、导航、展开与键盘', pagination: '页码切换、边界和禁用', steps: '步骤状态与当前步骤', tabs: '受控激活、键盘、禁用与面板关联', pageheader: '返回事件、标题/副标题与操作slot',
  autocomplete: '可提交任意文本、建议选择、键盘、异步options/loading、IME与受控回退', cascader: '多层路径、搜索、单/多路径、严格/联动与禁用', checkbox: '原生单项/分组、半选、数量约束与FormData', colorpicker: 'HEX/HSV、透明度、预设和浮层编辑', colorpickerpanel: '独立颜色面板、HSV/透明度/输入同步', datepicker: '单日期/范围、历盘键盘、最小最大与无效日期', datepickerpanel: '独立历盘、日期选择与禁用边界', datetimepicker: '日期+时间组合、范围校验与原生表单关联', form: '嵌套路径/动态数组、同步异步规则、错误聚焦、取消过期验证、重置', input: '文本/密码/多行/OTP原生语义、IME、错误与禁用', inputnumber: '合法数值/步进/上下界、键盘和FormData', inputtag: '标签新增删除、重复/禁用、IME和原生表单', inputotp: '分格输入、粘贴/退格/焦点、完整值提交', mentions: '光标处前缀匹配、键盘插入、IME与候选禁用', mention: '光标处前缀匹配、键盘插入、IME与候选禁用', radio: '原生单项/组、同组互斥和受控回退', rate: '评分、半星、键盘、只读与提交', select: '原生单多选、搜索多选、禁用和重复FormData', slider: '指针/键盘步进、范围与禁用', switch: '原生切换语义、受控状态与禁用', timepicker: '时分秒选择、步长/上下界、受控提交', timeselect: '按时段步长生成候选、上下界与禁用', transfer: '双栏搜索、勾选和移动、禁用项保护', treeselect: '树形搜索/展开、单多选/严格关联、键盘与表单', upload: '本地文件选择/拖放/验证、远程请求/自定义请求、进度/重试/取消与卸载清理',
  avatar: '图片/文字回退、尺寸和名称', badge: '状态/计数和可读文本', calendar: '月份切换、日期网格、选择/边界与日期slot', card: '内容分区、状态与操作slot', carousel: '受控轮播、键盘、循环/自动播放、悬停/隐藏/减动暂停', collapse: '受控折叠、键盘、内容可见性', descriptions: '资料标签值布局和slot', empty: '空状态文字和操作', image: '真实加载/失败、缩放预览、切换与卸载清理', list: '语义列表、item/header/footer/empty/loading slot', listy: '列表选择、行号和真实窗口化', popover: '受控浮层、定位、交互/关闭与焦点', qrcode: '真实UTF-8编码/独立解码、SVG/Canvas、纠错/图标/静区、状态刷新和导出', segmented: '受控单选、禁用、键盘与表单', statistic: '数字格式化、前后缀/精度与状态', table: '列与单元格slot、排序/过滤/选择/展开/分页、加载与空状态', tag: '状态标签与关闭交互', timeline: '时间顺序、节点状态与内容', tooltip: '悬停/焦点触发、稳定描述关系、关闭/定位与减动', tour: '真实目标定位/挖洞、步骤切换、缺失目标、焦点和关闭清理', tree: '层级展开/选择、复选联动/半选、禁用与键盘',
  alert: '信息/成功/警告/错误、说明与关闭', drawer: '侧/底抽屉、原生模态语义、焦点锁定、长内容滚动与清理', message: '顶部轻提示、多语义、计时暂停、动态更新/队列和上下文', modal: '模态焦点/返回、关闭策略、长内容与嵌套', dialog: '模态焦点/返回、关闭策略、长内容与嵌套', notification: '标题/详情通知、落点、队列、关闭和计时', popconfirm: '锚定确认、异步忙碌/失败/重试、焦点与取消', progress: '真实数值进度、进行中/成功/错误区别与可访问值', result: '结果状态、说明与后续操作', skeleton: '静态骨架/细雪花、尺寸和减动', spin: '双色细线旋转/错位变奏、加载名称与减动', watermark: '文本/图片的真实重复水印、尺寸旋转、变化/卸载清理',
  app: '组件树范围内的Message/Notification/MessageBox服务、独立销毁与Promise结果', borderbeam: '多条边框流光、速度/色彩可调、减动静态', configprovider: '可嵌套配置、theme/palette/density/motion/locale/dir/messages', scrollbar: '原生内容滚动、真实双轴拖动/键盘、RTL/动态尺寸、可访问与原生回退',
  virtualizedselect: '实际窗口化搜索多选、键盘活动项、IME与表单', virtualizedtable: '实际窗口化数据行、排序/选择/slot与绝对行序', virtualizedtree: '展开树扁平化窗口、键盘和选择', infinitescroll: '接近边界加载、并发锁定、完成/禁用、失败重试', backtop: '可配置滚动目标、出现阈值、返回顶部与减动', loading: '局部/全屏加载、延迟、取消、directive/service、键盘阻挡与清理', messagebox: 'alert/confirm/prompt、输入验证/异步取消、Promise结果与焦点', border: '边框宽度/材质/焦点的设计变量与组件示例', color: '四套材质主题、品牌/状态分离与对比度验证', util: 'Vue props/prop/ref类型提取以及纯TS防抖/节流/异步锁',
};
const entries = [];
for (const library of coverage.referenceCatalogs) for (const group of library.groups) for (const item of group.items) {
  const key = normalize(item.name);
  let components = special[key] ?? [...exports.keys()].filter(name => normalize(name.slice(1)) === key);
  if (library.id === 'element-plus' && key === 'layout') components = ['MGrid', 'MGridItem'];
  const kind = ['border', 'color'].includes(key) ? 'design-reference' : key === 'util' ? 'type-utility' : key === 'list' && library.id === 'ant-design' ? 'deprecated-reference' : 'component';
  const sources = kind === 'design-reference' ? ['design/tokens.json'] : kind === 'type-utility' ? ['src/utils/component-types.ts', 'src/utils/index.ts'] : components.map(name => exports.get(name) ?? `MISSING:${name}`);
  const present = sources.length > 0 && sources.every(file => fs.existsSync(path.join(root, file)));
  const acceptance = criteria[key]; if (!acceptance) throw new Error(`Missing core acceptance criteria for ${item.name}`);
  const entry = { library: library.id, version: library.version, category: group.category, name: item.name, kind, components, sources, acceptance, status: !present ? 'missing' : verified ? 'verified' : 'implementation-pending-verification' };
  entries.push(entry); item.components = components; item.coverage = kind === 'design-reference' ? 'design-token' : entry.status;
  if (item.note && key !== 'list') delete item.note;
}
coverage.publicComponentCount = exports.size;
coverage.checkedOn = '2026-11-05';
coverage.basis = '按Ant Design 6.7.0与Element Plus 2.14.7正式组件目录逐项对应；核心使用能力独立验证，API采用Vue与MaLang约定，不声明第三方API完全兼容。';
coverage.planning = verified ? '两份目录全部条目已有对应实现或设计/类型工具说明；155项逐项记录见component-parity.json。后续持续完善专业场景与API细节。' : '本轮按完整目录补齐，新增实现正在逐项验收；未通过验证前不视为完成。详情见component-parity.json。';
for (const item of coverage.items) {
  const matching = entries.filter(entry => coverage.referenceCatalogs.find(lib => lib.id === entry.library).groups.flatMap(group => group.items).find(row => row.name === entry.name).capability === item.id);
  item.components = [...new Set(matching.flatMap(entry => entry.components))];
  item.available = [...new Set(matching.map(entry => entry.acceptance))].join('；');
  item.boundary = '采用MaLang公开API，核心能力与验收依据见逐项对照；非第三方全部属性名兼容。';
  item.next = verified ? '在对应Story查看状态和用法；持续反馈真实业务边界。' : '正在运行类型、原生交互、浏览器和视觉验收。';
  item.status = matching.some(entry => entry.status === 'missing') ? 'planned' : 'added';
  item.priority = '';
}
const matrix = { schemaVersion: 1, date: '2026-11-05', scope: 'Ant Design与Element Plus正式核心目录并集；Pro、Charts、X、Mobile等独立产品不在两份核心目录内。Border/Color为设计参考，Util为类型工具，List保留实际列表实现。', verification: verified ? 'pnpm check; pnpm test:browser; SSR与四主题/窄屏实机检查' : 'pending', entries };
fs.writeFileSync(path.join(root, 'design/component-parity.json'), JSON.stringify(matrix, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'design/component-coverage.json'), JSON.stringify(coverage, null, 2) + '\n');
console.log(JSON.stringify({ publicComponents: exports.size, catalogEntries: entries.length, missing: entries.filter(entry => entry.status === 'missing').map(entry => `${entry.library}/${entry.name}`), verified }, null, 2));
