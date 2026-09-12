/* fs-switch 管道开关面板 — flow vs flow-deep 的参数裁剪可视化（iv-c 升级: 裁剪=可见事件）
 * 源: skills/flow/SKILL.md（按需启用/参数控制阶段）+ skills/flow-deep/SKILL.md（全量管道/参数速查）
 * 裁剪动效: 勾选参数 → 被裁 chip 变红划掉（line-through + 变暗, 停留 ~480ms）→ 收起消失（300ms, 多 chip 依次错峰 70ms）;
 *           取消勾选 → chip 弹回（scale 回弹 320ms）; chip 为常驻 DOM 复用, 状态类切换驱动动画（整管重建会杀死过渡）;
 *           reduce-motion: 跳过计时器与回弹, chip 直接消失/出现
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

  var CUT_DWELL = 480;  // 划掉态停留 ms（「被裁掉」要先被看见）
  var CUT_STAGGER = 70; // 多 chip 收起错峰 ms
  var CUT_FALL = 300;   // 收起过渡 ms（与 CSS .3s 同步）

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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

    // chip 常驻 DOM: 勾选只做状态类切换, 不再整管重建
    var chips = {}; // stage -> { chip, arrow, t1, t2 }
    var emptyEl = el('span', 'fs-sw-empty', '（全部裁掉——这在真实 flow 里不会发生: Stage 0/0.5/5 不可跳过）');
    emptyEl.style.display = 'none';

    DEEP.forEach(function (stg, i) {
      var arrow = null;
      if (i > 0) { arrow = el('span', 'fs-sw-arrow', '→'); pipe.appendChild(arrow); }
      var chip = el('span', 'fs-sw-chip', stg);
      if (/Stage 0|Stage 0\.5|Stage 5 /.test(stg)) chip.classList.add('fs-chip-must');
      pipe.appendChild(chip);
      chips[stg] = { chip: chip, arrow: arrow, t1: null, t2: null };
    });
    pipe.appendChild(emptyEl);

    function isChecked(id) { return ctrl.querySelector('input[value="' + id + '"]').checked; }

    // 收尾: 已收起的 chip 置 display:none 并重排可见箭头（避免 flex gap 在 0 宽元素间残留）
    function settle() {
      var seen = false;
      DEEP.forEach(function (stg) {
        var c = chips[stg];
        if (c.chip.style.display === 'none') return;
        if (c.arrow) c.arrow.style.display = seen ? '' : 'none';
        seen = true;
      });
    }

    function cutChip(stg, order) {
      var c = chips[stg];
      clearTimeout(c.t1); clearTimeout(c.t2);
      if (reduced()) {
        c.chip.style.display = 'none';
        c.chip.classList.remove('fs-sw-cut');
        c.chip.classList.remove('fs-sw-gone');
        settle();
        return;
      }
      c.chip.style.display = '';
      c.chip.classList.remove('fs-sw-gone');
      c.chip.classList.add('fs-sw-cut');
      var d = CUT_DWELL + order * CUT_STAGGER;
      c.t1 = setTimeout(function () { c.chip.classList.add('fs-sw-gone'); }, d);
      c.t2 = setTimeout(function () {
        c.chip.style.display = 'none';
        c.chip.classList.remove('fs-sw-cut');
        c.chip.classList.remove('fs-sw-gone');
        settle();
      }, d + CUT_FALL + 40);
    }

    function restoreChip(stg) {
      var c = chips[stg];
      clearTimeout(c.t1); clearTimeout(c.t2);
      c.chip.style.display = '';
      c.chip.classList.remove('fs-sw-cut');
      c.chip.classList.remove('fs-sw-gone');
      if (reduced()) { settle(); return; }
      c.chip.classList.remove('fs-sw-pop');
      void c.chip.offsetWidth; // 强制 reflow 重启回弹动画
      c.chip.classList.add('fs-sw-pop');
      settle();
    }

    var curActive = null;

    function render() {
      var cut = {};
      PARAMS.forEach(function (p) {
        if (isChecked(p.id)) {
          p.cut.forEach(function (stg) { cut[stg] = true; });
        }
      });
      var nextActive = DEEP.filter(function (stg) { return !cut[stg]; });

      if (curActive) {
        var order = 0;
        DEEP.forEach(function (stg) {
          var was = curActive.indexOf(stg) >= 0;
          var now = nextActive.indexOf(stg) >= 0;
          if (was && !now) { cutChip(stg, order); order++; }
          else if (!was && now) { restoreChip(stg); }
        });
      }
      curActive = nextActive;

      emptyEl.style.display = nextActive.length ? 'none' : '';
      var cmd = '/flow-deep ' + PARAMS.filter(function (p) {
        return isChecked(p.id);
      }).map(function (p) { return p.label; }).join(' ');
      note.textContent = '等价命令: ' + (cmd.trim() === '/flow-deep' ? '/flow-deep（全量，无参数）' : cmd);
      settle();
    }

    ctrl.addEventListener('change', render);
    render();
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-switch:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (n) { n.setAttribute('data-ready', '1'); build(n); });
  });
})();
