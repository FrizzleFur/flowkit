/* fs-switch 管道开关面板 — flow vs flow-deep 的参数裁剪可视化
 * 源: skills/flow/SKILL.md（按需启用/参数控制阶段）+ skills/flow-deep/SKILL.md（全量管道/参数速查）
 * 用法: <div class="fs-switch"></div>
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  // flow-deep 全量序列（skills/flow-deep/SKILL.md「核心架构」节）
  var DEEP = ['Stage -1 经验召回', 'Stage 0 前置检查', 'Stage 0.5 Goal Contract', 'Stage 1 Prompt 优化',
    'Stage 2 深度思考', 'Stage 3 规划+确认', 'Stage 3.5 独立审查', 'Stage 3.6 面板评审',
    'Stage 3.7 代码级细化', 'Stage 4 并发执行', 'Stage 5 Goal Verification', 'Stage 5.8 经验沉淀'];

  // 参数 → 剔除的阶段（教学简化映射; 真实语义见 flow-deep SKILL.md 参数速查）
  var PARAMS = [
    { id: 'no-prompt', label: '--no-prompt', cut: ['Stage 1 Prompt 优化'] },
    { id: 'no-think', label: '--no-think', cut: ['Stage 2 深度思考'] },
    { id: 'no-plan', label: '--no-plan', cut: ['Stage 3 规划+确认', 'Stage 3.5 独立审查', 'Stage 3.6 面板评审', 'Stage 3.7 代码级细化'] },
    { id: 'no-panel', label: '--no-panel', cut: ['Stage 3.6 面板评审'] },
    { id: 'no-multi', label: '--no-multi', cut: ['Stage 4 并发执行'] },
    { id: 'no-recall', label: '--no-recall', cut: ['Stage -1 经验召回'] },
    { id: 'no-distill', label: '--no-distill', cut: ['Stage 5.8 经验沉淀'] }
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build(root) {
    root.textContent = '';
    root.appendChild(el('div', 'fs-sw-intro',
      'flow 的「按需启用」哲学: 同一条管道，用参数裁掉不需要的阶段。勾选参数，看管道怎么变短——这就是 flow 与 flow-deep 的关系: 全量与裁剪，而非两套系统。'));

    var box = el('div', 'fs-sw-box');
    var ctrl = el('div', 'fs-sw-ctrl');
    PARAMS.forEach(function (p) {
      var lab = el('label', 'fs-sw-param');
      var cb = document.createElement('input');
      cb.type = 'checkbox'; cb.value = p.id;
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(' ' + p.label));
      ctrl.appendChild(lab);
    });
    box.appendChild(ctrl);

    var pipe = el('div', 'fs-sw-pipe');
    box.appendChild(pipe);
    root.appendChild(box);

    var note = el('div', 'fs-sw-note');
    root.appendChild(note);

    function render() {
      pipe.textContent = '';
      var active = DEEP.filter(function (stg) {
        return !PARAMS.some(function (p) {
          return p.cut.indexOf(stg) >= 0 && ctrl.querySelector('input[value="' + p.id + '"]').checked;
        });
      });
      if (!active.length) {
        pipe.appendChild(el('span', 'fs-sw-empty', '（全部裁掉——这在真实 flow 里不会发生: Stage 0/0.5/5 不可跳过）'));
      }
      active.forEach(function (stg, i) {
        if (i > 0) pipe.appendChild(el('span', 'fs-sw-arrow', '→'));
        var chip = el('span', 'fs-sw-chip', stg);
        if (/Stage 0|Stage 0\.5|Stage 5 /.test(stg)) chip.classList.add('fs-chip-must');
        pipe.appendChild(chip);
      });
      var cmd = '/flow-deep ' + PARAMS.filter(function (p) {
        return ctrl.querySelector('input[value="' + p.id + '"]').checked;
      }).map(function (p) { return p.label; }).join(' ');
      note.textContent = '等价命令: ' + (cmd.trim() === '/flow-deep' ? '/flow-deep（全量，无参数）' : cmd);
    }

    ctrl.addEventListener('change', render);
    render();
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-switch:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (n) { n.setAttribute('data-ready', '1'); build(n); });
  });
})();
