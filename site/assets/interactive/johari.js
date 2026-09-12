/* fs-johari 乔哈里象限判定演示 — prompt 评分的象限直觉训练
 * 源: skills/prompt/SKILL.md「乔哈里视窗四象限」+ 3S 原则
 * 简化声明: 本演示只练「象限识别」直觉; 完整评分（维度权重/3S 细则/喂模式）以 /prompt 技能为准
 * 用法: <div class="fs-johari"></div>
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  // 象限: Q1 公共知识(人知AI知) Q2 AI专业(人不知AI知) Q4 独有知识(人知AI不知) Q3 探索(都不知)
  var QUADS = [
    { key: 'Q1', label: '公共知识', hint: '用户知道、AI 也知道——如「写一个冒泡排序」' },
    { key: 'Q2', label: 'AI 专业知识', hint: '用户不知道、AI 知道——如最佳实践细节' },
    { key: 'Q4', label: '独有知识', hint: '用户知道、AI 不知道——内部系统/团队黑话/新造概念' },
    { key: 'Q3', label: '探索创新', hint: '双方都不知道——真正的开放探索' }
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

  function build(root) {
    root.textContent = '';
    root.appendChild(el('div', 'fs-jh-intro',
      '乔哈里视窗: 提示词的最大杀手是第四象限（你以为 AI 懂，其实它不懂）。判断下面 4 个提示各落在哪个象限:'));

    CASES.forEach(function (c) {
      var card = el('div', 'fs-jh-card');
      card.appendChild(el('div', 'fs-jh-text', c.text));
      var row = el('div', 'fs-jh-opts');
      var fb = el('div', 'fs-jh-fb');
      QUADS.forEach(function (q) {
        var b = el('button', 'fs-btn fs-jh-opt', q.label);
        b.title = q.hint;
        b.onclick = function () {
          Array.prototype.forEach.call(row.querySelectorAll('.fs-btn'), function (x) { x.disabled = true; });
          var right = q.key === c.answer;
          b.classList.add(right ? 'fs-opt-right' : 'fs-opt-wrong');
          fb.textContent = '';
          fb.className = 'fs-jh-fb ' + (right ? 'fs-fb-right' : 'fs-fb-wrong');
          fb.appendChild(el('div', null, (right ? '正确 — ' : '不对 — ') + c.answer + ' ' + (QUADS.filter(function (x) { return x.key === c.answer; })[0].label)));
          fb.appendChild(el('div', 'fs-jh-why', c.why));
        };
        row.appendChild(b);
      });
      card.appendChild(row); card.appendChild(fb);
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
