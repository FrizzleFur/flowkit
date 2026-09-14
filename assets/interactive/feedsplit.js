/* fs-feedsplit 喂模式前后对比 — 同一问句的两种回答命运（P8 对比分屏 / C11）
 * 源: skills/prompt/SKILL.md「喂模式」（第四象限独有知识必须喂, 否则 2 分封顶）
 * 用法: <div class="fs-feedsplit"></div>
 * 交互: 单按钮「对比」触发左右依次入场（stagger, CSS 变量 --fs-i 驱动 animation-delay）;
 *   reduce-motion 下不加按钮, 左右并排静态直出 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  var Q = '「审查我们公司 XYZ 系统，确保遵循 YYY 规范」';

  // 同一问句的两种回答要点（数据内置, 无需外部 JSON）
  var SIDES = [
    { side: 'plain', tag: '未喂', mark: '评不了内部概念',
      points: [
        { head: '反问背景', body: '「建议提供 XYZ 系统的架构文档与业务背景说明」——AI 不知道 XYZ 是什么，只能把问题原样抛回来' },
        { head: '通用清单', body: '「可参考业界通用的代码审查清单进行检查」——YYY 是内部规范，AI 只能拿通用清单充数' },
        { head: '原地打转', body: '「如需针对性分析，请补充更多上下文信息」——审查没有发生，一轮对话全耗在问「什么是 XYZ」' }
      ] },
    { side: 'fed', tag: '喂模式后', mark: '回答有据',
      points: [
        { head: '定义对齐', body: 'XYZ = 订单履约服务（Spring Boot 单体）; YYY = 内部 API 设计规范 v2.3——定义已随 prompt 附上' },
        { head: '示例验证', body: '每条规范配一组正反代码示例，先跑示例确认对规范的理解无偏差，再开始审查' },
        { head: '规范逐条', body: '按 YYY 的 12 条检查项逐条核对代码，命中违规处标注文件与行号' },
        { head: '输出格式', body: '产出「违规点 | 位置 | 整改建议」三列表格，按严重度降序排列' }
      ] }
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

    root.appendChild(el('div', 'fs-fs-q', '同一问句: ' + Q + ' —— 喂模式前后，回答是两种命运'));

    // 双栏: 左未喂 / 右喂模式后, 中缝分隔; stagger 延迟跨栏连续编号（左 0-2 → 右 3-6）
    var grid = el('div', 'fs-fs-grid');
    var delay = 0;
    var sides = SIDES.map(function (s) {
      var side = el('div', 'fs-fs-side fs-fs-side-' + s.side);
      var head = el('div', 'fs-fs-head');
      head.appendChild(el('span', 'fs-fs-tag', s.tag));
      head.appendChild(el('span', 'fs-fs-mark', s.mark));
      side.appendChild(head);
      s.points.forEach(function (p) {
        var item = el('div', 'fs-fs-item');
        item.appendChild(el('b', null, p.head));
        item.appendChild(document.createTextNode(' ' + p.body));
        item.style.setProperty('--fs-i', delay);
        delay += 1;
        side.appendChild(item);
      });
      return side;
    });
    grid.appendChild(sides[0]);
    grid.appendChild(el('div', 'fs-fs-div'));
    grid.appendChild(sides[1]);
    root.appendChild(grid);

    root.appendChild(el('div', 'fs-fs-note',
      '注: 不喂模式，第四象限的内部概念 AI 只能瞎猜（评分 ≤2 封顶）; 机制详见第 5 章正文与 skills/prompt/SKILL.md。'));

    if (reducedMotion()) {
      grid.classList.add('fs-fs-on'); // 直接左右并排静态, 不做入场动画
      return;
    }

    var btn = el('button', 'fs-btn fs-fs-go', '对比');
    root.insertBefore(btn, grid);
    var played = false;
    btn.onclick = function () {
      played = !played;
      if (played) grid.classList.add('fs-fs-on');
      else grid.classList.remove('fs-fs-on');
      btn.textContent = played ? '重置' : '对比';
    };
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-feedsplit:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (n) { n.setAttribute('data-ready', '1'); build(n); });
  });
})();
