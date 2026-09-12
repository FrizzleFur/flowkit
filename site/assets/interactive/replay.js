/* fs-replay 剧本回放器 — learn-claude-code simulator 模式的原生 JS 化
 * 用法: <div class="fs-replay" data-script="assets/scripts/xxx.json"></div>
 * 剧本: { title, steps: [{role: user|assistant|tool_call|tool_result|system, content, annotation}] }
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  var SPEEDS = [0.5, 1, 2, 4];
  var BASE_MS = 1200;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build(root, script) {
    root.innerHTML = '';
    var head = el('div', 'fs-replay-head');
    head.appendChild(el('span', 'fs-replay-title', script.title || '剧本回放'));
    var ctr = el('div', 'fs-replay-ctrl');
    var play = el('button', 'fs-btn fs-btn-primary', '播放');
    var step = el('button', 'fs-btn', '单步');
    var reset = el('button', 'fs-btn', '重置');
    var speed = el('select', 'fs-replay-speed');
    SPEEDS.forEach(function (s) {
      var o = el('option', null, s + 'x');
      o.value = s;
      if (s === 1) o.selected = true;
      speed.appendChild(o);
    });
    ctr.appendChild(play); ctr.appendChild(step); ctr.appendChild(reset); ctr.appendChild(speed);
    head.appendChild(ctr);
    root.appendChild(head);

    var stage = el('div', 'fs-replay-stage');
    root.appendChild(stage);

    var state = { idx: -1, playing: false, timer: null, speed: 1 };

    function renderStep(s) {
      var blk = el('div', 'fs-msg fs-' + s.role);
      blk.appendChild(el('span', 'fs-msg-role', label(s.role)));
      var body = el('div', 'fs-msg-body');
      var pre = el('pre', 'fs-msg-pre', s.content);
      body.appendChild(pre);
      blk.appendChild(body);
      stage.appendChild(blk);
      if (s.annotation) {
        var note = el('div', 'fs-msg-note', s.annotation);
        stage.appendChild(note);
      }
      stage.scrollTop = stage.scrollHeight;
    }

    function label(role) {
      return { user: '用户', assistant: '主会话', tool_call: '工具调用', tool_result: '工具结果', system: '系统/规则' }[role] || role;
    }

    function advance() {
      if (state.idx >= script.steps.length - 1) { stop(); return; }
      state.idx++;
      renderStep(script.steps[state.idx]);
    }

    function stop() { state.playing = false; clearTimeout(state.timer); play.textContent = '播放'; }

    function tick() {
      if (!state.playing) return;
      advance();
      if (state.idx >= script.steps.length - 1) { stop(); return; }
      state.timer = setTimeout(tick, BASE_MS / state.speed);
    }

    play.onclick = function () {
      if (state.playing) { stop(); return; }
      if (state.idx >= script.steps.length - 1) { state.idx = -1; stage.innerHTML = ''; }
      state.playing = true; play.textContent = '暂停';
      tick();
    };
    step.onclick = function () { stop(); advance(); };
    reset.onclick = function () { stop(); state.idx = -1; stage.innerHTML = ''; };
    speed.onchange = function () { state.speed = parseFloat(speed.value); };

    // 首步预览（吸引点击）
    renderStep(script.steps[0]);
    state.idx = 0;
  }

  function initAll() {
    var nodes = document.querySelectorAll('.fs-replay[data-script]:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (root) {
      root.setAttribute('data-ready', '1');
      fetch(root.getAttribute('data-script')).then(function (r) { return r.json(); })
        .then(function (script) { build(root, script); })
        .catch(function (err) {
          root.textContent = '';
          var d = el('div', 'fs-replay-err');
          d.appendChild(document.createTextNode('剧本加载失败: ' + err.message + '（需通过 HTTP 服务预览，file:// 不支持 fetch）'));
          root.appendChild(d);
        });
    });
  }

  FlowSite.fns.push(initAll);
})();
