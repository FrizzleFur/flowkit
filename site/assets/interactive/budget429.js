/* fs-budget 429 并发预算计算器 — 并发硬约束的可视化（iv-c 升级: 数字行 + 预算槽双出口）
 * 源: skills/flow-deep/SKILL.md「规模档位」节（有效并发 = 主会话 1 + 运行中 subagent + 其他活跃会话; 同消息 ≤3 防限流）
 * 演进线: 上限曾为 ≤2（2026-08 校准）→ ≤3（2026-09 上调）——以 SKILL.md 当前值为准
 * 预算槽: 三色液面堆叠（主会话蓝恒 1 格 / subagent 绿 / 其他会话橙），数字改动时液面 height/bottom 平滑过渡;
 *         点 + 时一颗「请求球」从对应源按钮飞入槽内液面落位（translate 400ms）; =4 第 4 格闪黄临界,
 *         ≥5 红框脉冲 + 429 横幅浮现, 回落时横幅收回; 双渲染出口由同一 judge() 驱动（防判定漂移）;
 *         reduce-motion: 无飞球无脉冲, 保留液面高度变化
 * 用法: <div class="fs-budget"></div>
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  var UNITS = 1 + 6 + 4; // 槽满 = 主会话 1 + subagent 6 + 其他会话 4

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function pct(n) { return (n / UNITS * 100) + '%'; }

  function setCls(e, cls, on) { if (on) e.classList.add(cls); else e.classList.remove(cls); }

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function build(root) {
    root.textContent = '';
    root.appendChild(el('div', 'fs-bd-intro',
      '并发预算 = 主会话（恒 1 路）+ 运行中 subagent + 其他活跃会话。超预算 → 429/1302 限流，实测 4 并发即触发。拖动数字感受预算怎么被吃掉:'));

    var box = el('div', 'fs-bd-box');
    var body = el('div', 'fs-bd-body');
    var col = el('div', 'fs-bd-col');
    var main = 1, subs = 2, others = 0, total = 3;

    var totalEl = el('div', 'fs-bd-total');
    var verdictEl = el('div', 'fs-bd-verdict');
    var eqEl = el('div', 'fs-bd-eq');

    /* ---- 预算槽: 刻度 / 三色液面 / 安全线 / 临界格 / 429 横幅 ---- */
    var gauge = el('div', 'fs-bd-gauge');
    var ticks = el('div', 'fs-bd-ticks');
    for (var k = 1; k < UNITS; k++) {
      var tick = el('div', 'fs-bd-tick');
      tick.style.bottom = pct(k);
      ticks.appendChild(tick);
    }
    var segM = el('div', 'fs-bd-seg fs-bd-seg-main');
    var segS = el('div', 'fs-bd-seg fs-bd-seg-subs');
    var segO = el('div', 'fs-bd-seg fs-bd-seg-others');
    var safeLine = el('div', 'fs-bd-safeline');
    var cell4 = el('div', 'fs-bd-cell4');
    var banner = el('div', 'fs-bd-429');
    banner.appendChild(el('b', null, '429'));
    banner.appendChild(el('span', null, 'Too Many Requests'));
    gauge.appendChild(ticks);
    gauge.appendChild(segM); gauge.appendChild(segS); gauge.appendChild(segO);
    gauge.appendChild(safeLine);
    gauge.appendChild(cell4);
    gauge.appendChild(banner);

    var gwrap = el('div', 'fs-bd-gwrap');
    gwrap.appendChild(gauge);
    var mark3 = el('span', 'fs-bd-mark fs-bd-mark-3', '3');
    mark3.style.bottom = pct(3);
    var mark4 = el('span', 'fs-bd-mark fs-bd-mark-4', '4');
    mark4.style.bottom = pct(4);
    gwrap.appendChild(mark3); gwrap.appendChild(mark4);

    var gcol = el('div', 'fs-bd-gaugecol');
    gcol.appendChild(el('div', 'fs-bd-gcap', '并发预算槽（满 ' + UNITS + '）'));
    gcol.appendChild(gwrap);

    /* 请求球: 从对应 + 按钮飞入槽内当前液面（纯装饰, 不参与判定; reduce-motion 跳过） */
    function flyBall(btn) {
      if (reduced() || !btn || !document.body) return;
      var r = btn.getBoundingClientRect();
      var g = gauge.getBoundingClientRect();
      if (!r.width || !g.height) return;
      var ball = el('div', 'fs-bd-ball fs-bd-ball-' + (btn.getAttribute('data-src') || 'subs'));
      var x0 = r.left + r.width / 2, y0 = r.top + r.height / 2;
      ball.style.left = x0 + 'px';
      ball.style.top = y0 + 'px';
      document.body.appendChild(ball);
      var tx = g.left + g.width / 2 - x0;
      var ty = g.bottom - g.height * (total / UNITS) - y0;
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        ball.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
        ball.style.opacity = '.15';
      }); });
      setTimeout(function () { if (ball.parentNode) ball.parentNode.removeChild(ball); }, 460);
    }

    /* ---- judge: 数字行与预算槽的唯一驱动（双出口同函数, 防判定漂移） ---- */
    function judge() {
      total = main + subs + others;
      // 出口一: 数字行（原有出口, 判定阈值不变）
      totalEl.textContent = total;
      eqEl.textContent = '1 + ' + subs + ' + ' + others + ' = ' + total;
      verdictEl.textContent = '';
      verdictEl.className = 'fs-bd-verdict';
      if (total <= 3) { verdictEl.classList.add('fs-bd-ok'); verdictEl.textContent = '安全（≤3）——当前规范安全区'; }
      else if (total === 4) { verdictEl.classList.add('fs-bd-warn'); verdictEl.textContent = '危险（=4）——实测触发 429 的临界点'; }
      else { verdictEl.classList.add('fs-bd-bad'); verdictEl.textContent = '越界（≥5）——必然限流: 停发新 agent、主会话接管、退避恢复'; }
      // 出口二: 预算槽（同一组数字, 三段液面自下而上: 主 → sub → 其他）
      segM.style.height = pct(main);   segM.style.bottom = '0%';
      segS.style.height = pct(subs);   segS.style.bottom = pct(main);
      segO.style.height = pct(others); segO.style.bottom = pct(main + subs);
      safeLine.style.bottom = pct(3);
      cell4.style.bottom = pct(3);
      cell4.style.height = pct(1);
      setCls(gauge, 'fs-bd-crit', total === 4);
      setCls(gauge, 'fs-bd-over', total >= 5);
    }

    function stepper(label, dotCls, val, min, max, src, apply, onFx) {
      var wrap = el('div', 'fs-bd-step');
      var lab = el('span', 'fs-bd-lab');
      lab.appendChild(el('i', 'fs-bd-dot ' + dotCls));
      lab.appendChild(document.createTextNode(label));
      wrap.appendChild(lab);
      var minus = el('button', 'fs-btn fs-bd-btn', '−');
      var num = el('span', 'fs-bd-num', String(val));
      var plus = el('button', 'fs-btn fs-bd-btn', '+');
      plus.setAttribute('data-src', src);
      minus.onclick = function () { if (val > min) { val--; num.textContent = val; apply(val); judge(); } };
      plus.onclick = function () { if (val < max) { val++; num.textContent = val; apply(val); judge(); if (onFx) onFx(plus); } };
      wrap.appendChild(minus); wrap.appendChild(num); wrap.appendChild(plus);
      return wrap;
    }

    col.appendChild(stepper('主会话（不可调）', 'fs-bd-dot-main', 1, 1, 1, 'main', function (v) { main = v; }, null));
    col.appendChild(stepper('运行中 subagent', 'fs-bd-dot-subs', 2, 0, 6, 'subs', function (v) { subs = v; }, flyBall));
    col.appendChild(stepper('其他活跃会话', 'fs-bd-dot-others', 0, 0, 4, 'others', function (v) { others = v; }, flyBall));

    var out = el('div', 'fs-bd-out');
    out.appendChild(el('span', 'fs-bd-cap', '有效并发'));
    out.appendChild(totalEl);
    out.appendChild(eqEl);
    out.appendChild(verdictEl);
    col.appendChild(out);

    body.appendChild(col);
    body.appendChild(gcol);
    box.appendChild(body);
    root.appendChild(box);

    root.appendChild(el('div', 'fs-bd-note',
      '注: 上限数字有演进史（≤2 → ≤3），教程以 skills/flow-deep/SKILL.md 当前值为准——这也是「约定级配置要写清来源」的小教训。'));
    judge();
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-budget:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (n) { n.setAttribute('data-ready', '1'); build(n); });
  });
})();
