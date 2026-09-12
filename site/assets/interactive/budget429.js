/* fs-budget 429 并发预算计算器 — 并发硬约束的可视化
 * 源: skills/flow-deep/SKILL.md「规模档位」节（有效并发 = 主会话 1 + 运行中 subagent + 其他活跃会话; 同消息 ≤3 防限流）
 * 演进线: 上限曾为 ≤2（2026-08 校准）→ ≤3（2026-09 上调）——以 SKILL.md 当前值为准
 * 用法: <div class="fs-budget"></div>
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function stepper(label, val, min, max, onChange) {
    var wrap = el('div', 'fs-bd-step');
    wrap.appendChild(el('span', 'fs-bd-lab', label));
    var minus = el('button', 'fs-btn fs-bd-btn', '−');
    var num = el('span', 'fs-bd-num', String(val));
    var plus = el('button', 'fs-btn fs-bd-btn', '+');
    minus.onclick = function () { if (val > min) { val--; num.textContent = val; onChange(val); } };
    plus.onclick = function () { if (val < max) { val++; num.textContent = val; onChange(val); } };
    wrap.appendChild(minus); wrap.appendChild(num); wrap.appendChild(plus);
    return wrap;
  }

  function build(root) {
    root.textContent = '';
    root.appendChild(el('div', 'fs-bd-intro',
      '并发预算 = 主会话（恒 1 路）+ 运行中 subagent + 其他活跃会话。超预算 → 429/1302 限流，实测 4 并发即触发。拖动数字感受预算怎么被吃掉:'));

    var box = el('div', 'fs-bd-box');
    var main = 1, subs = 2, others = 0;

    var totalEl = el('div', 'fs-bd-total');
    var verdictEl = el('div', 'fs-bd-verdict');
    var eqEl = el('div', 'fs-bd-eq');

    function judge() {
      var total = main + subs + others;
      totalEl.textContent = total;
      eqEl.textContent = '1 + ' + subs + ' + ' + others + ' = ' + total;
      verdictEl.textContent = '';
      verdictEl.className = 'fs-bd-verdict';
      if (total <= 3) { verdictEl.classList.add('fs-bd-ok'); verdictEl.textContent = '安全（≤3）——当前规范安全区'; }
      else if (total === 4) { verdictEl.classList.add('fs-bd-warn'); verdictEl.textContent = '危险（=4）——实测触发 429 的临界点'; }
      else { verdictEl.classList.add('fs-bd-bad'); verdictEl.textContent = '越界（≥5）——必然限流: 停发新 agent、主会话接管、退避恢复'; }
    }

    box.appendChild(stepper('主会话（不可调）', 1, 1, 1, function () { }));
    box.appendChild(stepper('运行中 subagent', 2, 0, 6, function (v) { subs = v; judge(); }));
    box.appendChild(stepper('其他活跃会话', 0, 0, 4, function (v) { others = v; judge(); }));

    var out = el('div', 'fs-bd-out');
    out.appendChild(el('span', 'fs-bd-cap', '有效并发'));
    out.appendChild(totalEl);
    out.appendChild(eqEl);
    out.appendChild(verdictEl);
    box.appendChild(out);
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
