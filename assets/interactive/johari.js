/* fs-johari 乔哈里视窗 2x2 判定演示 — prompt 评分的象限直觉训练
 * 源: skills/prompt/SKILL.md「乔哈里视窗四象限」+ 3S 原则
 * 简化声明: 本演示只练「象限识别」直觉; 完整评分（维度权重/3S 细则/喂模式）以 /prompt 技能为准
 * 用法: <div class="fs-johari"></div>
 * 批 4 升级: 一排按钮 → 真 2x2 田字格（列轴「用户知道与否」× 行轴「AI 知道与否」,
 *   四宫格域色点缀; 答对宫格亮起✓+坐标轴高亮, 答错✗闪红; reduce-motion 直接定格答案态） */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  // 象限: Q1 公共知识(人知AI知) Q2 AI专业(人不知AI知) Q4 独有知识(人知AI不知) Q3 探索(都不知)
  // tone 为宫格域色点缀; 数组顺序即田字格「从左到右、从上到下」落位
  var QUADS = [
    { key: 'Q1', label: '公共知识', hint: '用户知道、AI 也知道——如「写一个冒泡排序」', tone: 'emerald' },
    { key: 'Q2', label: 'AI 专业知识', hint: '用户不知道、AI 知道——如最佳实践细节', tone: 'blue' },
    { key: 'Q4', label: '独有知识', hint: '用户知道、AI 不知道——内部系统/团队黑话/新造概念', tone: 'amber' },
    { key: 'Q3', label: '探索创新', hint: '双方都不知道——真正的开放探索', tone: 'purple' }
  ];

  var CASES = [
    { text: '「帮我审查我们公司 XYZ 系统的代码，确保遵循 YYY 规范」', answer: 'Q4',
      why: 'XYZ/YYY 是内部概念——用户知道 AI 不知道。不「喂模式」（定义+示例）直接问，AI 只能瞎猜——典型 Q4 陷阱，不喂模式时评分 ≤2' },
    { text: '「写一个 Python 快速排序，要求 O(n log n)」', answer: 'Q1',
      why: '排序算法是公共知识——直接写即可，加复杂 Role 设定反而是过度设计（P 原则: 第一象限避免过度设计）' },
    { text: '「帮我分析这个全新架构方案的可行性」——方案是你刚发明、无先例的', answer: 'Q3',
      why: '方案是新的、答案未知——双方都在探索区，需要的是多轮协作而非一次性提问' },
    { text: '「修复这个 Swift 并发崩溃」——崩溃机理是成熟领域知识', answer: 'Q2',
      why: '并发数据竞争的机理是 AI 专业区——AI 比用户懂，问题描述清楚（堆栈/复现）即可，不需要用户先成为专家' }
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function build(root) {
    root.textContent = '';
    var answered = 0;
    var count = el('div', 'fs-jh-count', '已答 0/' + CASES.length);

    root.appendChild(el('div', 'fs-jh-intro',
      '乔哈里视窗: 提示词的最大杀手是第四象限（你以为 AI 懂，其实它不懂）。判断下面 4 个提示各落在哪个象限，点对应的宫格作答:'));
    root.appendChild(count);

    CASES.forEach(function (c, idx) {
      var card = el('div', 'fs-jh-card');
      card.appendChild(el('div', 'fs-jh-text', c.text));

      // 3x3 网格 = 轴标签圈住 2x2 宫格; 首题轴标常驻, 后续题轴标淡化（DOM 顺序即视觉顺序）
      var win = el('div', 'fs-jh-window' + (idx > 0 ? ' fs-jh-window-sub' : ''));
      var colA = el('div', 'fs-jh-axis', '用户知道');
      var colB = el('div', 'fs-jh-axis', '用户不知道');
      var rowA = el('div', 'fs-jh-axis fs-jh-axis-y', 'AI 知道');
      var rowB = el('div', 'fs-jh-axis fs-jh-axis-y', 'AI 不知道');
      var fb = el('div', 'fs-jh-fb');
      var cells = {};

      QUADS.forEach(function (q) {
        var b = el('button', 'fs-jh-cell fs-jh-tone-' + q.tone);
        b.title = q.hint;
        b.appendChild(el('div', 'fs-jh-qname', q.label));
        b.appendChild(el('div', 'fs-jh-qhint', q.hint));
        b.onclick = function () {
          if (b.disabled) return;
          Array.prototype.forEach.call(win.querySelectorAll('button'), function (x) { x.disabled = true; });
          var right = q.key === c.answer;
          var ans = QUADS.filter(function (x) { return x.key === c.answer; })[0];
          // 轴标签高亮: 用坐标系本身讲一遍「为什么是这一格」
          ((ans.key === 'Q1' || ans.key === 'Q4') ? colA : colB).classList.add('fs-jh-axis-hit');
          ((ans.key === 'Q1' || ans.key === 'Q2') ? rowA : rowB).classList.add('fs-jh-axis-hit');
          cells[c.answer].classList.add('fs-jh-hit');
          if (!right) b.classList.add(reducedMotion() ? 'fs-jh-miss' : 'fs-jh-miss-flash');
          else if (!reducedMotion()) b.classList.add('fs-jh-hit-pop');
          answered += 1;
          count.textContent = '已答 ' + answered + '/' + CASES.length;
          fb.textContent = '';
          fb.className = 'fs-jh-fb ' + (right ? 'fs-fb-right' : 'fs-fb-wrong');
          fb.appendChild(el('div', null, (right ? '正确 — ' : '不对 — ') + c.answer + ' ' + ans.label));
          fb.appendChild(el('div', 'fs-jh-why', c.why));
        };
        cells[q.key] = b;
      });

      [el('div', 'fs-jh-corner'), colA, colB, rowA, cells.Q1, cells.Q2, rowB, cells.Q4, cells.Q3]
        .forEach(function (n) { win.appendChild(n); });
      card.appendChild(win);
      card.appendChild(fb);
      root.appendChild(card);
    });

    root.appendChild(el('div', 'fs-jh-note',
      '注: 本演示为象限直觉简化版; 完整评分体系（3S 原则/维度权重/喂模式三法）见 skills/prompt/SKILL.md。'));
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-johari:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (n) { n.setAttribute('data-ready', '1'); build(n); });
  });
})();
