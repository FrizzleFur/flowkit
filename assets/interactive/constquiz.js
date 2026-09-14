/* fs-constquiz 宪法四问自检 — ch11 设计宪法的教学化
 * 规则源: skills/flow-deep/SKILL.md:33-48（四问+三铁律）; 教程 ch11 锁一
 * 用法: <div class="fs-constquiz"></div>
 * 案例为教学化转述（真实精神、虚构提案），每问答案标注宪法判据。
 * quiz 家族第三族（fs-cq 前缀）: 与 fs-ad、fs-jh 两族共用基脸（components.css B5-1 纪律）
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  var QS = [
    { n: '问一 · 必要性', q: '已有纪律覆盖不了吗？' },
    { n: '问二 · 可拆性', q: '能降级为按需启用的纪律吗？' },
    { n: '问三 · 可跳过性', q: '用户有清晰的 --no-xxx 逃生阀吗？' },
    { n: '问四 · 控制权', q: '在帮用户决策，而不是替用户决策？' }
  ];

  var CASES = [
    {
      proposal: '提案: 给管道加一个「每次会话强制全量读取知识库」的 Stage——任何任务、任何人，不可跳过',
      answers: [false, false, false, false],
      whys: [
        '不过——LRU 分档与关键词召回已覆盖按需读取，全量读取是重复建设（问一专防这个）',
        '不过——完全可降级为「召回时按命中增量读取」的按需纪律，无需强制 Stage',
        '不过——没有任何逃生阀，用户被流程劫持（宪法第 3 问的直接反面）',
        '不过——替用户烧掉上下文预算，是典型暴君化'
      ],
      ruling: '拒绝', tone: 'bad',
      rulingWhy: '四问全不过——这正是宪法要拦下的形态: 强制面最大、逃生阀为零。改造方向: 整个提案降级为纪律层能力（召回命中才读、读多少由匹配决定），根本不进 Stage 管道。'
    },
    {
      proposal: '提案: 新增「实现完成后自动代码审查」Stage——对所有任务默认强制启用',
      answers: [true, true, false, true],
      whys: [
        '过——实现完成后的审查没有现成纪律覆盖，有真实新建理由',
        '过——可降级为按需启用的审查纪律（这正是下面的处置方向）',
        '不过——默认强制却没有 --no-xxx 逃生阀；宪法要求: 要么给逃生阀，要么写清为什么必须强制',
        '过——审查产出是建议清单不是决定，最终裁决仍在用户手里'
      ],
      ruling: '改造后可过', tone: 'warn',
      rulingWhy: '必要性与控制权过关，卡在可跳过性。宪法的标准改造: 加 --no-review 逃生阀；或更进一步——降级为「registry 里可用但默认不启用」的条目，宁做后者（三铁律第 2 条）。'
    },
    {
      proposal: '提案: 新增「验证失败后的迭代修复」Stage——传 --iterate N 才启用，自带 keep/revert 回滚协议',
      answers: [true, true, true, true],
      whys: [
        '过——验证失败后的系统化修复无既有覆盖',
        '过——本身就是按需形态: 不传参不进管道',
        '过——逃生阀就是参数本身: 不传 --iterate 即天然跳过',
        '过——每轮迭代 keep/revert 由机械验证判定，不是替用户拍板'
      ],
      ruling: '通过', tone: 'good',
      rulingWhy: '四问全过，且三铁律不违反: 纪律层做能力、不默认塞管道、唯一的强制点（回滚协议）写明了 why。这就是宪法想放行的形态——注意它依然带逃生阀与机械判定，不是「看起来有用就上」。'
    }
  ];

  var OPTS = [
    { key: true, label: '过', hint: '这一问立得住' },
    { key: false, label: '不过', hint: '这一问被宪法拦下' }
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build(root) {
    root.textContent = '';
    var score = 0, ci = 0, qi = 0;
    var intro = el('div', 'fs-cq-intro',
      '宪法四问不必背——对每个提案逐问判定「过 / 不过」，看四道锁怎么拦人、怎么放行。规则源: skills/flow-deep/SKILL.md 设计宪法（ch11 锁一）。');
    root.appendChild(intro);

    var bar = el('div', 'fs-cq-bar');
    var prog = el('span', 'fs-cq-prog');
    var scoreEl = el('span', 'fs-cq-score');
    bar.appendChild(prog); bar.appendChild(scoreEl);
    root.appendChild(bar);

    var cardBox = el('div', 'fs-cq-card');
    root.appendChild(cardBox);

    function updateBar() {
      prog.textContent = '案例 ' + (ci + 1) + ' / ' + CASES.length + ' · 第 ' + (qi + 1) + ' 问';
      scoreEl.textContent = '判对 ' + score;
    }

    function showQuestion() {
      cardBox.textContent = '';
      var c = CASES[ci];
      if (qi === 0) {
        cardBox.appendChild(el('div', 'fs-cq-proposal', c.proposal));
      }
      var cur = QS[qi];
      cardBox.appendChild(el('div', 'fs-cq-step', cur.n));
      cardBox.appendChild(el('div', 'fs-cq-qtext', cur.q));
      var row = el('div', 'fs-cq-opts');
      OPTS.forEach(function (o) {
        var b = el('button', 'fs-btn fs-cq-opt', o.label);
        b.title = o.hint;
        b.onclick = function () { judge(c, o.key, b); };
        row.appendChild(b);
      });
      cardBox.appendChild(row);
      updateBar();
    }

    function judge(c, key, btn) {
      var expected = c.answers[qi];
      var right = key === expected;
      if (right) score++;
      Array.prototype.forEach.call(cardBox.querySelectorAll('.fs-cq-opt'), function (b) { b.disabled = true; });
      btn.classList.add(right ? 'fs-opt-right' : 'fs-opt-wrong');
      var fb = el('div', 'fs-cq-fb ' + (right ? 'fs-fb-right' : 'fs-fb-wrong'));
      fb.appendChild(el('div', 'fs-fb-verdict', (right ? '判对 — ' : '再想 — ') + c.whys[qi]));
      var last = qi === QS.length - 1;
      var next = el('button', 'fs-btn fs-btn-primary', last ? '查看处置' : '下一问');
      next.onclick = function () {
        if (last) { showRuling(c); } else { qi++; showQuestion(); }
      };
      fb.appendChild(next);
      cardBox.appendChild(fb);
      updateBar();
    }

    function showRuling(c) {
      cardBox.textContent = '';
      var ruling = el('div', 'fs-cq-verdict');
      ruling.appendChild(el('div', 'fs-cq-ruling fs-cq-r-' + c.tone, '处置: ' + c.ruling));
      ruling.appendChild(el('div', 'fs-cq-rwhy', c.rulingWhy));
      cardBox.appendChild(ruling);
      var lastCase = ci === CASES.length - 1;
      var next = el('button', 'fs-btn fs-btn-primary', lastCase ? '再来一轮' : '下一案例');
      next.onclick = function () {
        if (lastCase) {
          var done = el('div', 'fs-cq-done', '完成: 12 问判对 ' + score +
            (score >= 10 ? ' — 四问已内化, 可以去给管道立法了' : ' — 可回顾锁一的三铁律再来一轮'));
          cardBox.textContent = '';
          cardBox.appendChild(done);
          var again = el('button', 'fs-btn fs-btn-primary', '从头再来');
          again.onclick = function () { score = 0; ci = 0; qi = 0; showQuestion(); };
          cardBox.appendChild(again);
          return;
        }
        ci++; qi = 0; showQuestion();
      };
      cardBox.appendChild(next);
      updateBar();
    }

    showQuestion();
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-constquiz:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (n) { n.setAttribute('data-ready', '1'); build(n); });
  });
})();
