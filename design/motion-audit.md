# 交互动效盘点

本次按公开入口核对了 100 个组件。逐项的触发条件、现有表现、源码行号、已有测试和下一步记录在 [motion-audit.json](./motion-audit.json)。

现有组件中，MSegmented 已有一块随选项平移并调宽高的共享滑座。MTabs 用各标签自己的下划线做淡入和伸展。MMenu 和 MTree 已有行色过渡及铰链旋转，当前项换行时刻线仍会跳位。MAnchor 的阅读位置、MPagination 的当前页和 MCarousel 的指示点也直接换状态。

| 顺序 | 统一动作 | 首批落点 | 浏览器验收 |
| --- | --- | --- | --- |
| 1 | 持续高亮沿真实目标移动 | Tabs、Menu、Anchor。接着覆盖单选 Tree、Steps、Pagination、Carousel | 同一装饰节点的起点、中帧和终点可测。方向键焦点与已确认选择分开。RTL、窄屏、长文字与容器滚动下仍对齐。 |
| 2 | 键盘和鼠标的候选游标 | Combobox、AutoComplete、VirtualSelect。再复用到选择模式的 VirtualList、Listy、VirtualTree、TreeSelect、Cascader、DropdownMenu 和 Mention | 近处短移，跨窗口直接到位。输入法、禁用候选、快速筛选以及真实滚动保持正确。 |
| 3 | 展开时揭页，收起时收锋 | Accordion、Menu/Tree 分组、Table 明细、FloatButtonGroup | 快速反向从当前帧接续。成组离场保持原位置，离场控件即时退出焦点和原生表单提交。 |
| 4 | 同一容器内换页与换状态 | DatePicker、DatePickerPanel、Calendar。后续用于 Carousel 内容、Tour 步骤、Image 和 Result | 日期网格尺寸稳定，选中日、今日和焦点分别可辨。只在稳定内容槽做短换页。 |
| 5 | 增删与反馈归位 | Toast/Message 同栈回位、Upload 文件行、普通 List 和 Timeline。以 InputTag、Transfer、FormList 示例为现有样板 | 重排保留草稿、焦点和业务数据。通知寿命和单一播报、文件传输及取消的真实状态独立。 |

日期选择的日格反馈可以先做，整月换页留到稳定容器的过渡。表格和虚拟表格优先补行勾选反馈、排序标记和明细开合，避免让整张表在排序时一起移动。

普通 MVirtualList 没有选中状态，只有开启 selectable 才有候选行和受控选择。MListy 委托给它。MVirtualTable 的选择是独立行勾选，没有需要在行间滑动的单一当前项。MFormList 提供稳定键和插槽，已验证的过渡来自示例的显式接入。虚拟化回收、分栏拖拽、原生选择控件和纯布局组件按现有交互直接更新。

证据按具体行为记录。17 项引用了既有浏览器运行或独立实测，包括 Segmented 对齐和减动、已接入的列表过渡，以及拖拽和边界几何。83 项核对了源码。常规行为测试不代表已经验证滑移轨迹。最新二维码的屏上与两种导出合计 48/48 解码通过，遮罩切换已通过最终静态回归。Timeline 在 360px 四主题下已确认连接线与节点底边相接，底边中心保持节点边框色。以上五组是后续改进项，尚未统一实现。实施后按表中的验收条件进行浏览器验证。本次盘点未启动浏览器回归。

本批最终产物通过 258 条浏览器回归（两个分片各 129 条），其中二维码专属 6 条、Timeline 相关 4 条；完整构建、类型和消费声明检查通过。该结果覆盖当前实现，五组后续改进仍为 planned。
