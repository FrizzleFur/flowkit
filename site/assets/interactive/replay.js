/* fs-replay v2 — 声明式多面板步进引擎（learncc useSteppedVisualization 的零依赖复刻）
 *
 * 兼容两种剧本 schema:
 *  v1（旧）: { title, steps:[{role, content, annotation}] }              → 单消息面板回放
 *  v2（新）: { title, version:2, layout, flow:{nodes,edges},             → 流程图 + 多消息面板 + 旁白
 *             messagesPanels:[{id,title}], steps:[{title,desc,on,edgesOn,append,clear}] }
 *
 * 协议文档: assets/scripts/PROTOCOL.md
 * 用法: <div class="fs-replay" data-script="assets/scripts/xxx.json"></div>
 *       <div class="fs-replay fs-loop" data-script="..."></div>（多面板布局）
 * 生命周期: 引擎持有计时器; 重初始化/面板替换时统一 clear（防计时器泄漏）
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  var SPEEDS = [0.5, 1, 2, 4];
  var BASE_MS = 1600;
  var ROLE_CLS = { user: 'fs-chip-user', assistant: 'fs-chip-asst', tool_call: 'fs-chip-tool', tool_result: 'fs-chip-tool', system: 'fs-chip-sys', task: 'fs-chip-task', final: 'fs-chip-final' };
  var ROLE_LABEL = { user: 'user', assistant: 'assistant', tool_call: 'tool_use', tool_result: 'tool_result', system: 'system', task: 'task', final: 'final' };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function clearTimer(st) { if (st.timer) { clearTimeout(st.timer); st.timer = null; } }

  /* ---------- v1 → v2 归一化 ---------- */
  function normalize(script) {
    if (script.version === 2) return script;
    var steps = script.steps.map(function (s) {
      var ann = typeof s.annotation === 'string' ? { desc: s.annotation } : (s.annotation || {});
      var app = {};
      if (s.role) app.main = [{ role: s.role, label: s.content }];
      return { title: ann.title || ROLE_LABEL[s.role] || '', desc: ann.desc || ann.title || s.content || '', append: app };
    });
    return { title: script.title, version: 2, layout: 'messages', messagesPanels: [{ id: 'main', title: 'messages[]' }], steps: steps };
  }

  /* ---------- 面板: 流程图（SVG 动态构建） ---------- */
  function buildFlow(host, flow) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    var W = 0, H = 0;
    flow.nodes.forEach(function (n) { W = Math.max(W, n.x + n.w); H = Math.max(H, n.y + n.h); });
    svg.setAttribute('viewBox', '0 0 ' + (W + 16) + ' ' + (H + 16));
    var nodeById = {};
    flow.nodes.forEach(function (n) { nodeById[n.id] = n; });
    // 边（中心到中心直线 + 箭头 marker）
    var defs = document.createElementNS(NS, 'defs');
    var mk = document.createElementNS(NS, 'marker');
    mk.setAttribute('id', 'fs-arrow'); mk.setAttribute('viewBox', '0 0 8 8'); mk.setAttribute('refX', '7'); mk.setAttribute('refY', '4'); mk.setAttribute('markerWidth', '7'); mk.setAttribute('markerHeight', '7'); mk.setAttribute('orient', 'auto');
    var ap = document.createElementNS(NS, 'path'); ap.setAttribute('d', 'M0,0 L8,4 L0,8 Z'); ap.setAttribute('fill', '#94a3b8');
    mk.appendChild(ap); defs.appendChild(mk); svg.appendChild(defs);
    var edgeEls = {};
    flow.edges.forEach(function (e) {
      var a = nodeById[e.from], b = nodeById[e.to];
      if (!a || !b) return;
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M' + (a.x + a.w / 2 + 8) + ',' + (a.y + a.h / 2 + 8) + ' L' + (b.x + b.w / 2 + 8) + ',' + (b.y + b.h / 2 + 8));
      p.setAttribute('class', 'fs-edge'); p.setAttribute('marker-end', 'url(#fs-arrow)');
      svg.appendChild(p);
      edgeEls[e.from + '>' + e.to] = p;
      if (e.label) {
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('x', (a.x + a.w / 2 + b.x + b.w / 2) / 2 + 14); t.setAttribute('y', (a.y + a.h / 2 + b.y + b.h / 2) / 2 + 4);
        t.setAttribute('class', 'fs-edgelabel'); t.textContent = e.label;
        svg.appendChild(t);
      }
    });
    var nodeEls = {};
    flow.nodes.forEach(function (n) {
      var g = document.createElementNS(NS, 'g');
      var shape;
      if (n.type === 'diamond') {
        shape = document.createElementNS(NS, 'polygon');
        var cx = n.x + n.w / 2 + 8, cy = n.y + n.h / 2 + 8;
        shape.setAttribute('points', cx + ',' + (cy - n.h / 2) + ' ' + (cx + n.w / 2) + ',' + cy + ' ' + cx + ',' + (cy + n.h / 2) + ' ' + (cx - n.w / 2) + ',' + cy);
      } else {
        shape = document.createElementNS(NS, 'rect');
        shape.setAttribute('x', n.x + 8); shape.setAttribute('y', n.y + 8);
        shape.setAttribute('width', n.w); shape.setAttribute('height', n.h); shape.setAttribute('rx', '6');
      }
      shape.setAttribute('class', 'fs-node');
      g.appendChild(shape);
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', n.x + n.w / 2 + 8); t.setAttribute('y', n.y + n.h / 2 + 12);
      t.setAttribute('class', 'fs-nodelabel'); t.textContent = n.label;
      g.appendChild(t);
      svg.appendChild(g);
      nodeEls[n.id] = g;
    });
    host.appendChild(svg);
    return { els: nodeEls, edges: edgeEls };
  }

  /* ---------- 面板: 消息 ---------- */
  function buildMsgPanel(host, conf) {
    var box = el('div', 'fs-msgpanel');
    var bar = el('div', 'fs-msgpanel-bar');
    bar.appendChild(el('span', null, conf.title || conf.id));
    var len = el('span', 'fs-lenbadge', 'len=0');
    bar.appendChild(len);
    box.appendChild(bar);
    var body = el('div', 'fs-msgpanel-body');
    box.appendChild(body);
    host.appendChild(box);
    return { body: body, len: len, count: 0 };
  }

  function chipFor(b) {
    var row = el('div', 'fs-block');
    var chip = el('span', 'fs-chip ' + (ROLE_CLS[b.role] || 'fs-chip-asst'), b.role || 'assistant');
    row.appendChild(chip);
    if (b.label) row.appendChild(el('span', 'fs-blocklabel', b.label));
    return row;
  }

  /* ---------- 引擎 ---------- */
  function build(root, script) {
    script = normalize(script);
    root.textContent = '';
    var layout = script.layout || (script.flow ? 'flow+messages' : 'messages');
    var multi = script.messagesPanels && script.messagesPanels.length > 1;

    var head = el('div', 'fs-replay-head');
    head.appendChild(el('span', 'fs-replay-title', script.title || '步进演示'));
    var ctr = el('div', 'fs-replay-ctrl');
    var play = el('button', 'fs-btn fs-btn-primary', '播放');
    var step = el('button', 'fs-btn', '单步');
    var reset = el('button', 'fs-btn', '重置');
    var speed = el('select', 'fs-replay-speed');
    SPEEDS.forEach(function (sp) { var o = el('option', null, sp + 'x'); o.value = sp; if (sp === 1) o.selected = true; speed.appendChild(o); });
    ctr.appendChild(play); ctr.appendChild(step); ctr.appendChild(reset); ctr.appendChild(speed);
    head.appendChild(ctr);
    root.appendChild(head);

    var stage = el('div', 'fs-stage' + (layout.indexOf('flow') === 0 ? ' fs-stage-flow' : ''));
    root.appendChild(stage);

    var flowHost = null, flow = null;
    var msgPanels = {}, msgOrder = [];
    if (script.flow) {
      flowHost = el('div', 'fs-flowhost');
      stage.appendChild(flowHost);
      flow = buildFlow(flowHost, script.flow);
    }
    if (script.messagesPanels) {
      var mwrap = el('div', 'fs-msgwrap' + (multi ? ' fs-msgwrap-multi' : ''));
      stage.appendChild(mwrap);
      script.messagesPanels.forEach(function (c) { msgPanels[c.id] = buildMsgPanel(mwrap, c); msgOrder.push(c.id); });
    }
    var note = el('div', 'fs-annoc');
    root.appendChild(note);
    var dots = el('div', 'fs-dots');
    root.appendChild(dots);

    var st = { idx: -1, playing: false, timer: null, speed: 1, total: script.steps.length };

    function renderDots() {
      dots.textContent = '';
      for (var i = 0; i < st.total; i++) dots.appendChild(el('span', 'fs-dot' + (i <= st.idx ? ' fs-dot-on' : ''), '●'));
      dots.appendChild(el('span', 'fs-dotnum', (st.idx + 1) + '/' + st.total));
    }
    function applyStep(i) {
      var s = script.steps[i];
      if (!s) return;
      if (flow) {
        flow.els && Object.keys(flow.els).forEach(function (id) { flow.els[id].firstChild.setAttribute('class', 'fs-node' + (s.on && s.on.indexOf(id) >= 0 ? ' on' : '')); });
        flow.edges && Object.keys(flow.edges).forEach(function (k) { flow.edges[k].setAttribute('class', 'fs-edge' + (s.edgesOn && s.edgesOn.indexOf(k) >= 0 ? ' on' : '')); });
      }
      if (s.clear) s.clear.forEach(function (pid) { if (msgPanels[pid]) { msgPanels[pid].body.textContent = ''; msgPanels[pid].count = 0; } });
      if (s.append) Object.keys(s.append).forEach(function (pid) {
        var p = msgPanels[pid]; if (!p) return;
        s.append[pid].forEach(function (b) { p.body.appendChild(chipFor(b)); p.count++; });
        p.len.textContent = 'len=' + p.count;
      });
      if (s.title || s.desc) {
        note.textContent = '';
        if (s.title) note.appendChild(el('b', null, s.title));
        if (s.desc) note.appendChild(el('span', null, s.desc));
      }
      renderDots();
      var act = root.querySelector('.fs-stage');
      if (act) act.scrollTop = act.scrollHeight;
    }
    function advance() {
      if (st.idx >= st.total - 1) { stop(); return; }
      st.idx++; applyStep(st.idx);
    }
    function stop() { st.playing = false; clearTimer(st); play.textContent = '播放'; }
    function tick() {
      if (!st.playing) return;
      advance();
      if (st.idx >= st.total - 1) { stop(); return; }
      st.timer = setTimeout(tick, BASE_MS / st.speed);
    }
    play.onclick = function () {
      if (st.playing) { stop(); return; }
      if (st.idx >= st.total - 1) {
        st.idx = -1;
        Object.keys(msgPanels).forEach(function (pid) { msgPanels[pid].body.textContent = ''; msgPanels[pid].count = 0; msgPanels[pid].len.textContent = 'len=0'; });
      }
      st.playing = true; play.textContent = '暂停'; tick();
    };
    step.onclick = function () { stop(); advance(); };
    reset.onclick = function () {
      stop(); st.idx = -1;
      Object.keys(msgPanels).forEach(function (pid) { msgPanels[pid].body.textContent = ''; msgPanels[pid].count = 0; msgPanels[pid].len.textContent = 'len=0'; });
      note.textContent = ''; renderDots();
    };
    speed.onchange = function () { st.speed = parseFloat(speed.value); };

    renderDots();
    applyStep(0); st.idx = 0; renderDots(); // 首步预渲染——打开即有画面（learncc 式）

    // 进视口自动播放一次（learncc 行为）；reduce-motion 用户与手动重置后不自动重播
    var played = false;
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !played) { played = true; io.disconnect(); setTimeout(function () { if (!st.playing) { st.idx = -1; Object.keys(msgPanels).forEach(function (pid) { msgPanels[pid].body.textContent = ''; msgPanels[pid].count = 0; msgPanels[pid].len.textContent = 'len=0'; }); st.playing = true; play.textContent = '暂停'; tick(); } }, 400); }
        });
      }, { threshold: 0.35 });
      io.observe(root);
    }
  }

  function initAll() {
    var nodes = document.querySelectorAll('.fs-replay[data-script]:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (root) {
      root.setAttribute('data-ready', '1');
      var st = { timer: null };
      fetch(root.getAttribute('data-script')).then(function (r) { return r.json(); })
        .then(function (script) {
          // 清理旧引擎计时器（若 data 重挂载）
          if (root._fsClear) root._fsClear();
          root._fsClear = function () { clearTimer(st); };
          build(root, script);
        })
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
