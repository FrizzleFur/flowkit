/* fs-replay v2 — 声明式多面板步进引擎（learncc useSteppedVisualization 的零依赖复刻）
 *
 * 兼容两种剧本 schema:
 *  v1（旧）: { title, steps:[{role, content, annotation}] }              → 单消息面板回放
 *  v2（新）: { title, version:2, layout, flow:{nodes,edges,cruise},       → 流程图(+巡游) + 多消息面板 + 旁白
 *             curve:{curves,flags}, messagesPanels:[{id,title}],
 *             steps:[{title,desc,on,edgesOn,append,clear,reveal}] }
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
  function reducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

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
    return { els: nodeEls, edges: edgeEls, svg: svg }; // svg 供巡游 token 挂载
  }

  /* ---------- 面板: 曲线（reveal 逐段生长; 坐标系左下原点） ---------- */
  function buildCurve(host, conf) {
    var NS = 'http://www.w3.org/2000/svg';
    var PW = 320, PH = 190, ML = 36, MR = 14, MT = 14, MB = 26;
    var xMax = conf.xMax || 100, yMax = conf.yMax || 100;
    function X(v) { return ML + (v / xMax) * PW; }
    function Y(v) { return MT + PH - (v / yMax) * PH; }
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + (PW + ML + MR) + ' ' + (PH + MT + MB));
    [0.25, 0.5, 0.75].forEach(function (f) {
      var l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', ML); l.setAttribute('x2', ML + PW);
      l.setAttribute('y1', MT + PH * (1 - f)); l.setAttribute('y2', MT + PH * (1 - f));
      l.setAttribute('class', 'fs-curve-grid');
      svg.appendChild(l);
    });
    var axis = document.createElementNS(NS, 'path');
    axis.setAttribute('d', 'M' + ML + ',' + MT + ' L' + ML + ',' + (MT + PH) + ' L' + (ML + PW) + ',' + (MT + PH));
    axis.setAttribute('class', 'fs-curve-axis'); axis.setAttribute('fill', 'none');
    svg.appendChild(axis);
    // 轴刻度（0 与量程）
    [['0', ML, MT + PH + 13, 'middle'], [String(xMax), ML + PW, MT + PH + 13, 'middle'],
     ['0', ML - 5, MT + PH + 3, 'end'], [String(yMax), ML - 5, MT + 4, 'end']].forEach(function (t) {
      var e = document.createElementNS(NS, 'text');
      e.setAttribute('x', t[1]); e.setAttribute('y', t[2]); e.setAttribute('text-anchor', t[3]);
      e.setAttribute('class', 'fs-curve-label'); e.textContent = t[0];
      svg.appendChild(e);
    });
    // 参考线: x = yThreshold 处贯穿竖直虚线（协议约定）
    if (conf.yThreshold != null) {
      var th = document.createElementNS(NS, 'line');
      th.setAttribute('x1', X(conf.yThreshold)); th.setAttribute('x2', X(conf.yThreshold));
      th.setAttribute('y1', MT); th.setAttribute('y2', MT + PH);
      th.setAttribute('class', 'fs-curve-flag'); th.setAttribute('stroke', '#71717a');
      svg.appendChild(th);
      var tht = document.createElementNS(NS, 'text');
      tht.setAttribute('x', X(conf.yThreshold) + 4); tht.setAttribute('y', MT + 9);
      tht.setAttribute('class', 'fs-curve-flaglabel'); tht.setAttribute('fill', '#a1a1aa');
      tht.textContent = String(conf.yThreshold);
      svg.appendChild(tht);
    }
    // 里程碑旗标
    (conf.flags || []).forEach(function (f) {
      var fl = document.createElementNS(NS, 'line');
      fl.setAttribute('x1', X(f.x)); fl.setAttribute('x2', X(f.x));
      fl.setAttribute('y1', MT); fl.setAttribute('y2', MT + PH);
      fl.setAttribute('class', 'fs-curve-flag'); fl.setAttribute('stroke', f.color || '#3b82f6');
      svg.appendChild(fl);
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', X(f.x)); t.setAttribute('y', MT + 9);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'fs-curve-flaglabel'); t.setAttribute('fill', f.color || '#3b82f6');
      t.textContent = '⚑ ' + (f.label || '');
      svg.appendChild(t);
    });
    // 曲线本体: path + 手动累加段长（cum），reveal 值 = 画到第几个点
    var state = {};
    (conf.curves || []).forEach(function (c) {
      var pts = c.points || [];
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ');
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d); path.setAttribute('class', 'fs-curveline');
      path.setAttribute('stroke', c.color || '#3b82f6');
      var cum = [0];
      for (var i = 1; i < pts.length; i++) {
        var dx = X(pts[i][0]) - X(pts[i - 1][0]), dy = Y(pts[i][1]) - Y(pts[i - 1][1]);
        cum.push(cum[i - 1] + Math.sqrt(dx * dx + dy * dy));
      }
      var total = cum[cum.length - 1] || 0;
      path.setAttribute('stroke-dasharray', total);
      path.setAttribute('stroke-dashoffset', total); // 初始全隐藏
      svg.appendChild(path);
      var tip = document.createElementNS(NS, 'circle');
      tip.setAttribute('r', '3.5'); tip.setAttribute('fill', c.color || '#3b82f6');
      tip.setAttribute('class', 'fs-crvetip'); tip.style.display = 'none';
      svg.appendChild(tip);
      state[c.id] = { conf: c, pts: pts, path: path, tip: tip, total: total, cum: cum, cur: 0, raf: null };
    });
    var yl = document.createElementNS(NS, 'text');
    yl.setAttribute('x', 11); yl.setAttribute('y', MT + PH / 2);
    yl.setAttribute('transform', 'rotate(-90 11 ' + (MT + PH / 2) + ')');
    yl.setAttribute('text-anchor', 'middle'); yl.setAttribute('class', 'fs-curve-label');
    yl.textContent = conf.yLabel || '';
    svg.appendChild(yl);
    var xl = document.createElementNS(NS, 'text');
    xl.setAttribute('x', ML + PW / 2); xl.setAttribute('y', MT + PH + 24);
    xl.setAttribute('text-anchor', 'middle'); xl.setAttribute('class', 'fs-curve-label');
    xl.textContent = conf.xLabel || '';
    svg.appendChild(xl);
    var legend = el('div', 'fs-curve-legend');
    (conf.curves || []).forEach(function (c) {
      var item = el('span', 'fs-curve-legitem');
      var sw = el('i', 'fs-legend-swatch'); sw.style.background = c.color || '#3b82f6';
      item.appendChild(sw); item.appendChild(document.createTextNode(c.label || c.id));
      legend.appendChild(item);
    });
    host.appendChild(svg); host.appendChild(legend);

    function pointAt(cs, len) { // 折线上取点（纯几何计算，不依赖 DOM 几何 API）
      if (len <= 0) return { x: X(cs.pts[0][0]), y: Y(cs.pts[0][1]) };
      for (var i = 1; i < cs.cum.length; i++) {
        if (len <= cs.cum[i] || i === cs.cum.length - 1) {
          var seg = (cs.cum[i] - cs.cum[i - 1]) || 1;
          var f = Math.max(0, Math.min(1, (len - cs.cum[i - 1]) / seg));
          return { x: X(cs.pts[i - 1][0]) + (X(cs.pts[i][0]) - X(cs.pts[i - 1][0])) * f,
                   y: Y(cs.pts[i - 1][1]) + (Y(cs.pts[i][1]) - Y(cs.pts[i - 1][1])) * f };
        }
      }
    }
    function setDraw(cs, len) {
      cs.cur = len;
      cs.path.setAttribute('stroke-dashoffset', cs.total - len);
      if (len > 0.5) {
        var p = pointAt(cs, len);
        cs.tip.setAttribute('cx', p.x); cs.tip.setAttribute('cy', p.y);
        cs.tip.style.display = '';
        cs.tip.classList.add('fs-breath'); // 呼吸动词: 活跃曲线端点
      } else {
        cs.tip.style.display = 'none';
        cs.tip.classList.remove('fs-breath');
      }
    }
    function reveal(id, k) {
      var cs = state[id];
      if (!cs || !cs.pts.length) return;
      var kk = Math.max(0, Math.min(k | 0, cs.pts.length));
      var target = kk > 0 ? cs.cum[kk - 1] : 0;
      if (cs.raf) { cancelAnimationFrame(cs.raf); cs.raf = null; } // 中途改目标: 从当前值续补间
      if (reducedMotion()) { setDraw(cs, target); return; }
      var from = cs.cur, t0 = performance.now(), dur = 600;
      function frame(now) {
        var t = Math.min(1, (now - t0) / dur);
        var e = 1 - (1 - t) * (1 - t); // ease-out 生长
        setDraw(cs, from + (target - from) * e);
        cs.raf = t < 1 ? requestAnimationFrame(frame) : null;
      }
      cs.raf = requestAnimationFrame(frame);
    }
    function reset() {
      Object.keys(state).forEach(function (id) {
        var cs = state[id];
        if (cs.raf) { cancelAnimationFrame(cs.raf); cs.raf = null; }
        setDraw(cs, 0);
      });
    }
    return { reveal: reveal, reset: reset, state: state };
  }

  /* ---------- 面板: 泳道（多列并行 + 条目状态流动） ---------- */
  var LANE_STATE = { queued: 'fs-li-queued', running: 'fs-li-running', done: 'fs-li-done', failed: 'fs-li-failed' };
  function buildLanes(host, lanes) {
    var wrap = el('div', 'fs-lanes');
    var colEls = {};
    lanes.forEach(function (c) {
      var col = el('div', 'fs-lane');
      col.appendChild(el('div', 'fs-lane-title', c.title || c.id));
      var body = el('div', 'fs-lane-body');
      col.appendChild(body);
      wrap.appendChild(col);
      colEls[c.id] = body;
    });
    host.appendChild(wrap);
    return { cols: colEls, items: {} };
  }
  function laneItemEl(id, conf) {
    var d = el('div', 'fs-laneitem ' + (LANE_STATE[conf.state] || 'fs-li-queued'));
    d.appendChild(el('span', 'fs-li-label', conf.label || id));
    if (conf.note) d.appendChild(el('span', 'fs-li-note', conf.note));
    return d;
  }
  function applyLaneSet(lanesObj, set) {
    if (!set) return;
    Object.keys(set).forEach(function (id) {
      var want = set[id];
      if (want === null || want.removed) {
        if (lanesObj.items[id]) { lanesObj.items[id].remove(); delete lanesObj.items[id]; }
        return;
      }
      var target = lanesObj.cols[want.lane];
      if (!target) return;
      var it = lanesObj.items[id];
      if (!it) { it = laneItemEl(id, want); lanesObj.items[id] = it; target.appendChild(it); }
      else {
        if (it.parentNode !== target) target.appendChild(it); // 换道（离散移动 + 入场动画重放）
        it.className = 'fs-laneitem ' + (LANE_STATE[want.state] || 'fs-li-queued');
        if (want.note) it.querySelector('.fs-li-note') ? it.querySelector('.fs-li-note').textContent = want.note : it.appendChild(el('span', 'fs-li-note', want.note));
      }
    });
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
    var layout = script.layout || (script.flow ? 'flow+messages' : (script.curve ? 'curve+messages' : 'messages'));
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

    var stage = el('div', 'fs-stage' + (layout.indexOf('flow') === 0 || layout.indexOf('curve') === 0 ? ' fs-stage-flow' : ''));
    root.appendChild(stage);

    var flowHost = null, flow = null;
    var lanesObj = null, laneHost = null;
    var msgPanels = {}, msgOrder = [];
    if (script.flow) {
      flowHost = el('div', 'fs-flowhost');
      stage.appendChild(flowHost);
      flow = buildFlow(flowHost, script.flow);
    }
    var curveObj = null;
    if (script.curve) {
      var curveHost = el('div', 'fs-curvehost');
      stage.appendChild(curveHost);
      curveObj = buildCurve(curveHost, script.curve);
    }
    if (script.lanes) {
      laneHost = el('div', 'fs-lanehost');
      stage.appendChild(laneHost);
      lanesObj = buildLanes(laneHost, script.lanes);
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

    /* ---------- 巡游（flow.cruise）: 终态后发光 token 沿节点序列连续巡游 ---------- */
    var cruiseConf = (script.flow && script.flow.cruise && flow) ? script.flow.cruise : null;
    if (!(cruiseConf && cruiseConf.path && cruiseConf.path.length > 1)) cruiseConf = null;
    var cruise = { timer: null, raf: null, active: false, idx: 0, pulses: {}, token: null, paths: {} };
    var nodeCenter = {};
    if (cruiseConf) {
      var CNS = 'http://www.w3.org/2000/svg';
      script.flow.nodes.forEach(function (n) { nodeCenter[n.id] = { x: n.x + n.w / 2 + 8, y: n.y + n.h / 2 + 8 }; });
      var token = document.createElementNS(CNS, 'circle');
      token.setAttribute('r', '5'); token.setAttribute('fill', '#3b82f6'); token.setAttribute('class', 'fs-token');
      token.style.display = 'none';
      flow.svg.appendChild(token);
      cruise.token = token;
    }
    function segPath(aId, bId) { // 优先复用已画边; 未连通段用隐形直线补
      var key = aId + '>' + bId;
      if (flow.edges[key]) return flow.edges[key];
      if (cruise.paths[key]) return cruise.paths[key];
      var a = nodeCenter[aId], b = nodeCenter[bId];
      if (!a || !b) return null;
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M' + a.x + ',' + a.y + ' L' + b.x + ',' + b.y);
      p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'none');
      flow.svg.appendChild(p); flow.svg.appendChild(cruise.token); // token 保持最上层
      cruise.paths[key] = p;
      return p;
    }
    function restoreNode(id) { // 脉动结束后恢复该步的权威点亮状态
      var g = flow.els[id];
      if (!g) return;
      var s = script.steps[st ? Math.max(0, st.idx) : 0];
      var on = !!(s && s.on && s.on.indexOf(id) >= 0);
      g.firstChild.setAttribute('class', 'fs-node' + (on ? ' on fs-breath' : ''));
    }
    function pulseNode(id) { // 路过节点: 点亮 0.6s（fill transition + breath 即脉动）
      var g = flow.els[id];
      if (!g) return;
      if (cruise.pulses[id]) clearTimeout(cruise.pulses[id]);
      g.firstChild.setAttribute('class', 'fs-node on fs-breath');
      cruise.pulses[id] = setTimeout(function () { delete cruise.pulses[id]; restoreNode(id); }, 600);
    }
    function stopCruise() {
      cruise.active = false;
      if (cruise.timer) { clearTimeout(cruise.timer); cruise.timer = null; }
      if (cruise.raf) { cancelAnimationFrame(cruise.raf); cruise.raf = null; }
      if (cruise.token) cruise.token.style.display = 'none';
      Object.keys(cruise.pulses).forEach(function (id) { clearTimeout(cruise.pulses[id]); delete cruise.pulses[id]; restoreNode(id); });
    }
    function startCruise() {
      if (!cruiseConf || cruise.active || reducedMotion()) return;
      var first = nodeCenter[cruiseConf.path[0]];
      if (!first || !cruise.token) return;
      cruise.active = true; cruise.idx = 0;
      cruise.token.style.display = '';
      cruise.token.setAttribute('cx', first.x); cruise.token.setAttribute('cy', first.y);
      pulseNode(cruiseConf.path[0]);
      cruise.timer = setTimeout(cruiseHop, Math.max(200, cruiseConf.intervalMs || 900));
    }
    function cruiseHop() { // 每段 getPointAtLength + rAF 按边长匀速
      if (!cruise.active) return;
      var path = cruiseConf.path;
      var to = path[(cruise.idx + 1) % path.length];
      var seg = segPath(path[cruise.idx], to);
      if (!seg) { stopCruise(); return; }
      var len = seg.getTotalLength();
      var dur = Math.max(240, len / 0.16); // 0.16 viewBox-px/ms 匀速
      var t0 = performance.now();
      cruise.raf = requestAnimationFrame(function frame(now) {
        if (!cruise.active) return;
        var t = Math.min(1, (now - t0) / dur);
        var pt = seg.getPointAtLength(len * t);
        cruise.token.setAttribute('cx', pt.x); cruise.token.setAttribute('cy', pt.y);
        if (t < 1) { cruise.raf = requestAnimationFrame(frame); return; }
        cruise.raf = null;
        cruise.idx = (cruise.idx + 1) % path.length; // 走完回绕起点
        pulseNode(to);
        cruise.timer = setTimeout(cruiseHop, Math.max(200, cruiseConf.intervalMs || 900));
      });
    }

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
        flow.els && Object.keys(flow.els).forEach(function (id) { flow.els[id].firstChild.setAttribute('class', 'fs-node' + (s.on && s.on.indexOf(id) >= 0 ? ' on fs-breath' : '')); });
        flow.edges && Object.keys(flow.edges).forEach(function (k) { flow.edges[k].setAttribute('class', 'fs-edge' + (s.edgesOn && s.edgesOn.indexOf(k) >= 0 ? ' on' : '')); });
      }
      if (s.clear) s.clear.forEach(function (pid) { if (msgPanels[pid]) { msgPanels[pid].body.textContent = ''; msgPanels[pid].count = 0; } });
      if (s.lanes && lanesObj) applyLaneSet(lanesObj, s.lanes.set);
      if (s.reveal && curveObj) Object.keys(s.reveal).forEach(function (id) { curveObj.reveal(id, s.reveal[id]); });
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
      if (st.total > 0 && i >= st.total - 1 && !st.playing && cruiseConf) startCruise(); // 手动步进到终态也巡游
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
      if (st.idx >= st.total - 1) { stop(); if (cruiseConf) startCruise(); return; } // 播完启动巡游
      st.timer = setTimeout(tick, BASE_MS / st.speed);
    }
    play.onclick = function () {
      if (st.playing) { stop(); return; }
      if (st.idx >= st.total - 1) {
        st.idx = -1;
        stopCruise(); if (curveObj) curveObj.reset(); // 重播前归零巡游与曲线
        Object.keys(msgPanels).forEach(function (pid) { msgPanels[pid].body.textContent = ''; msgPanels[pid].count = 0; msgPanels[pid].len.textContent = 'len=0'; });
      }
      st.playing = true; play.textContent = '暂停'; tick();
    };
    step.onclick = function () { stop(); advance(); };
    reset.onclick = function () {
      stop(); st.idx = -1;
      stopCruise(); if (curveObj) curveObj.reset();
      Object.keys(msgPanels).forEach(function (pid) { msgPanels[pid].body.textContent = ''; msgPanels[pid].count = 0; msgPanels[pid].len.textContent = 'len=0'; });
      if (lanesObj) { Object.keys(lanesObj.items).forEach(function (id) { lanesObj.items[id].remove(); delete lanesObj.items[id]; }); }
      note.textContent = ''; renderDots();
    };
    speed.onchange = function () { st.speed = parseFloat(speed.value); };

    renderDots();
    applyStep(0); st.idx = 0; renderDots(); // 首步预渲染——打开即有画面（learncc 式）
    if (cruiseConf && st.total === 0) cruise.timer = setTimeout(startCruise, 600); // 无 steps: 加载后即巡游

    // 巡游计时器并入 root._fsClear 生命周期链（重初始化/离开页面必清）
    var prevClear = root._fsClear;
    root._fsClear = function () { if (prevClear) prevClear(); stopCruise(); };

    // 进视口自动播放一次（learncc 行为）；reduce-motion 用户与手动重置后不自动重播
    var played = false;
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !played) { played = true; io.disconnect(); setTimeout(function () { if (!st.playing) { stopCruise(); if (curveObj) curveObj.reset(); st.idx = -1; Object.keys(msgPanels).forEach(function (pid) { msgPanels[pid].body.textContent = ''; msgPanels[pid].count = 0; msgPanels[pid].len.textContent = 'len=0'; }); st.playing = true; play.textContent = '暂停'; tick(); } }, 400); }
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
