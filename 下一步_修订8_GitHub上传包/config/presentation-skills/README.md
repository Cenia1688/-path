# 呈现方法的来源与使用范围

本次整合不修改 config/theory.json，不训练或微调 DeepSeek 参数。每次请求由服务端加入团队整理的短方法文件，并选择当前专业的少量研究线索。四种方法随同一次分析发送，不再多调用模型润色。原仓库中的自动操作、人物角色及未经核实的行业说法没有整体执行或导入。

| 来源 | 采用部分 | 文件 | 舍弃或限制 |
|---|---|---|---|
| https://github.com/blader/humanizer | 自然、具体、保留条件的表达 | language.md | 不改变事实、取舍或不确定性 |
| https://github.com/GresonKwan/JobOK | 要求、个人证据、缺口与行动对应 | evidence.md | 不制造个人优势或综合适合度 |
| https://github.com/career-ops-hq/career-ops | 对多个岗位逐项比较的方式 | jobs.md | 不接入爬虫、自动投递、评分排序 |
| https://github.com/alchaincyf/zhangxuefeng-skill | 追问成本、资格、退出代价 | practical.md | 不模仿人物语气；不用性别、外貌、家庭财力推断人的价值或追求 |

以上四项上游许可证为 MIT，副本在 licenses/ 中。本地是经项目取舍的简化方法，未声称保留上游全部能力。API 不会自动读取桌面安装的 skill；实际加载路径见 config/presentation-skills.json 和 lib/presentation.mjs。

## 图表组件（非商业用途）

来源：https://github.com/larashero3-dotcom/lieflat-charts 。本 skill 由“躺在废墟里”开发，公开分发时保留此署名。许可证：PolyForm Noncommercial 1.0.0，完整副本 licenses/lieflat-charts.txt。

选型比较：F5 Tick Rows适合单组数量；F6 Paired Rungs适合成对数量但刻度较密；F12 Dumbbell Queue用同轴两个点比较数量，更适合本版紧凑呈现。因此读取 templates/basics-gallery.html 的真实 F12 模板，保留轴线、连接线和空实点骨架，修改为“你可用/机会要求”；删除计数珠、随机扰动、动画和外部字体。代码仅在 public/condition-charts.mjs，样式在 simple.css 末尾。

时间与预算分别作图，各用自己的单位和轴；只有相同时间范围及币种、准确值齐全才展示。不用区间中点或未知的0替代。零是有效值。图表不发送网络请求、不依赖额外库、不计模型调用。

如果将来改作商业用途，应重新审查许可证或替换该组件：移除 result-overview.mjs 中该组件的导入和两次 renderConditionChart 调用即可保留全部数据表与规则。许可证要求不能仅通过删除署名规避。

## 社交平台材料

config/research-leads.json 是未核实的探索线索，不是招聘/招生事实库。社会学与思政截图用于形成可核实问题；哲学20张截图特别保留高层次院校、硕博与境外经历的样本边界。职位、薪资、证书与政策未独立核验时不成为事实引用。

kkdaxue网页读取失败，未制造评论内容；仍记录为待获取。个别院校就业去向图片缺届次、学位与分母，不据此估计就业率。热门帖、夸张时间线及高赞评论不等于追踪数据。
