/* fs-hero — 封面「管道增长」hero 动画（learncc 首页 Message Growth 的 flowkit 化）
 *
 * 用法: <div class="fs-hero"></div>（docsify 封面 _coverpage.md）
 * 结构: 一行五块阶段胶囊（Stage -1 召回 → 0.5 契约 → 3 规划 → 5 验证 → 5.8 沉淀）
 *       + 下方模拟 messages[] 增长条（chip 逐个 append, len 徽章递增, 复用 fs-chip 色）
 * 动效: 页面加载即循环——五块从左到右逐个点亮, 每块亮起时其 chips 弹入, 走完停 1.2s 重置;
 *       prefers-reduced-motion: reduce 时全部静态点亮不循环
 * 生命周期: 计时器经 root._fsClear 托管, 重初始化先清再建（照 replay.js 模式）
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  var STEP_MS = 700;   // 每块点亮间隔
  var HOLD_MS = 1200;  // 走完停留
  var RESET_MS = 350;  // 重置后的空档, 再进入下一轮
  var ROLE_CLS = { user: 'fs-chip-user', assistant: 'fs-chip-asst', tool: 'fs-chip-tool', tool_call: 'fs-chip-tool', tool_result: 'fs-chip-tool', system: 'fs-chip-sys', task: 'fs-chip-task', final: 'fs-chip-final' };

  // 五阶段及其亮起时追加进 messages[] 的 chips（role 即 chip 文本, 对应 fs-chip 色）
  var STAGES = [
    { tag: 'Stage -1', name: '召回', chips: [{ role: 'system', label: '召回上下文' }] },
    { tag: 'Stage 0.5', name: '契约', chips: [{ role: 'task', label: '契约卡就位' }] },
    { tag: 'Stage 3', name: '规划', chips: [{ role: 'user', label: '计划下发' }] },
    { tag: 'Stage 5', name: '验证', chips: [{ role: 'tool_use', label: 'verify' }, { role: 'tool_result', label: 'pass' }] },
    { tag: 'Stage 5.8', name: '沉淀', chips: [{ role: 'final', label: '经验入库' }] }
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function chipFor(b) {
    var row = el('span', 'fs-hero-chiprow');
    row.appendChild(el('span', 'fs-chip ' + (ROLE_CLS[b.role] || 'fs-chip-asst'), b.role));
    row.appendChild(el('span', 'fs-blocklabel', b.label));
    return row;
  }

  function build(root) {
    root.textContent = '';
    var row = el('div', 'fs-hero-row');
    var stages = STAGES.map(function (s) {
      var b = el('div', 'fs-hero-stage');
      b.appendChild(el('span', 'fs-hero-tag', s.tag));
      b.appendChild(el('span', 'fs-hero-name', s.name));
      row.appendChild(b);
      return b;
    });
    root.appendChild(row);

    var bar = el('div', 'fs-hero-msgs');
    var barHead = el('div', 'fs-hero-msgsbar');
    barHead.appendChild(el('span', null, 'messages[]'));
    var len = el('span', 'fs-lenbadge', 'len=0');
    barHead.appendChild(len);
    bar.appendChild(barHead);
    var body = el('div', 'fs-hero-chips');
    bar.appendChild(body);
    root.appendChild(bar);
    return { stages: stages, body: body, len: len };
  }

  function reset(ui) {
    ui.stages.forEach(function (s) { s.classList.remove('fs-hero-on'); });
    ui.body.textContent = '';
    ui.len.textContent = 'len=0';
  }

  function initAll() {
    var nodes = document.querySelectorAll('.fs-hero:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (root) {
      root.setAttribute('data-ready', '1');
      if (root._fsClear) root._fsClear(); // 清旧引擎计时器（防重挂载泄漏）
      var ui = build(root);
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced) {
        // 静态降级: 全部点亮、chips 一次铺满、不循环
        var total = 0;
        ui.stages.forEach(function (s) { s.classList.add('fs-hero-on'); });
        STAGES.forEach(function (stg) { stg.chips.forEach(function (b) { ui.body.appendChild(chipFor(b)); total++; }); });
        ui.len.textContent = 'len=' + total;
        return;
      }

      var st = { i: -1, timer: null, count: 0 };
      function step() {
        st.i++;
        if (st.i >= STAGES.length) {
          // 走完停 1.2s → 重置 → 空档后重新循环
          st.timer = setTimeout(function () {
            reset(ui); st.i = -1; st.count = 0;
            st.timer = setTimeout(step, RESET_MS);
          }, HOLD_MS);
          return;
        }
        var s = STAGES[st.i];
        ui.stages[st.i].classList.add('fs-hero-on');
        s.chips.forEach(function (b) { ui.body.appendChild(chipFor(b)); st.count++; });
        ui.len.textContent = 'len=' + st.count;
        st.timer = setTimeout(step, STEP_MS);
      }
      root._fsClear = function () { if (st.timer) { clearTimeout(st.timer); st.timer = null; } };
      st.timer = setTimeout(step, 400);
    });
  }

  FlowSite.fns.push(initAll);
})();
