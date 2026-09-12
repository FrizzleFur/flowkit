/* fs-autodecide 判定游戏 — panel-review.md Auto-Decide Layer 的教学化
 * 规则源: skills/flow-deep/references/panel-review.md「6 个决策原则」（P1-P6 顺序判定，命中即停）
 * 用法: <div class="fs-autodecide"></div>
 * 案例为教学化转述（真实精神、虚构情境），每题答案标注命中的原则。
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  var CASES = [
    { finding: '评审发现: 采集脚本缺少输入验证，直接拼接用户参数', answer: 'AUTO', principle: 'P1 行业标准优先',
      why: '「缺少输入验证」有明确行业最佳实践答案——P1 命中即 AUTO_APPROVED，自动采纳并记录，不打扰用户' },
    { finding: '评审发现: 数据库 schema 变更影响 2 个文件（低于 3 文件线）', answer: 'TASTE', principle: 'P6 例外条款',
      why: '影响面 <3 文件本可 AUTO，但 P6 例外: schema 变更不论文件数一律上浮——先读例外再数文件' },
    { finding: '评审发现: API 密钥可能出现在日志输出中', answer: 'BLOCKED', principle: 'P2 CRITICAL 级',
      why: '安全相关不走 P1 自动采纳; 按风险分级属 CRITICAL（数据泄露）——直接 BLOCKED 阻塞' },
    { finding: '评审建议: 为未来微服务化预留接口层（当前单体运行良好，无拆分计划）', answer: 'TASTE', principle: 'P4 YAGNI',
      why: '前瞻性建议无明确需求——不自动拒绝也不自动采纳，标记 [YAGNI] 上浮让用户权衡' },
    { finding: '评审建议: 改用 Memcached——但 Stage 2 已与用户确认选 Redis', answer: 'AUTO', principle: 'P3 已批决策一致性',
      why: '与已批决策冲突时保持已批决策（保持 Redis），记录冲突说明——避免评审推翻用户裁定' },
    { finding: '评审发现: 变量命名风格不统一（snake/camel 混用）', answer: 'AUTO', principle: 'P2 LOW 级',
      why: 'LOW 级（命名/格式/注释类）静默记录即可—— AUTO_APPROVED 不阻塞不上浮' },
    { finding: '评审建议: 给公开端点加 rate limiting', answer: 'TASTE', principle: 'P5 安全一律上浮',
      why: '安全相关但不到 HIGH——P5 兜住: 安全问题不自动处理，一律 [SECURITY] 上浮' },
    { finding: '评审发现: 重构涉及 5 个文件的接口签名统一', answer: 'TASTE', principle: 'P6 不可逆',
      why: '影响面 ≥3 文件（跨模块/接口变更）——标记 [IRREVERSIBLE] 上浮' }
  ];

  var OPTS = [
    { key: 'AUTO', label: 'AUTO_APPROVED', hint: '自动采纳，静默记录' },
    { key: 'TASTE', label: 'TASTE_DECISION', hint: '上浮给用户裁决' },
    { key: 'BLOCKED', label: 'BLOCKED', hint: '直接阻塞，必须解决' }
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build(root) {
    root.textContent = '';
    var score = 0, idx = 0;
    var intro = el('div', 'fs-ad-intro',
      '你是评审综合层。对每个发现做出路由判定——规则: panel-review.md 的 P1→P6 顺序判定，命中即停。');
    root.appendChild(intro);

    var bar = el('div', 'fs-ad-bar');
    var prog = el('span', 'fs-ad-prog');
    var scoreEl = el('span', 'fs-ad-score');
    bar.appendChild(prog); bar.appendChild(scoreEl);
    root.appendChild(bar);

    var cardBox = el('div', 'fs-ad-card');
    root.appendChild(cardBox);

    function updateBar() {
      prog.textContent = (idx < CASES.length ? idx + 1 : idx) + ' / ' + CASES.length;
      scoreEl.textContent = '答对 ' + score;
    }

    function showCase() {
      cardBox.textContent = '';
      if (idx >= CASES.length) {
        var done = el('div', 'fs-ad-done', '完成: ' + score + '/' + CASES.length + ' 正确' +
          (score >= 6 ? ' — 判定链已内化' : ' — 可回顾 P1-P6 再来一轮'));
        var again = el('button', 'fs-btn fs-btn-primary', '再来一轮');
        again.onclick = function () { score = 0; idx = 0; updateBar(); showCase(); };
        cardBox.appendChild(done); cardBox.appendChild(again);
        return;
      }
      var c = CASES[idx];
      cardBox.appendChild(el('div', 'fs-ad-finding', c.finding));
      var row = el('div', 'fs-ad-opts');
      OPTS.forEach(function (o) {
        var b = el('button', 'fs-btn fs-ad-opt', o.label);
        b.title = o.hint;
        b.onclick = function () { judge(c, o.key, b); };
        row.appendChild(b);
      });
      cardBox.appendChild(row);
    }

    function judge(c, key, btn) {
      var right = key === c.answer;
      if (right) score++;
      Array.prototype.forEach.call(cardBox.querySelectorAll('.fs-ad-opt'), function (b) { b.disabled = true; });
      btn.classList.add(right ? 'fs-opt-right' : 'fs-opt-wrong');
      var fb = el('div', 'fs-ad-feedback ' + (right ? 'fs-fb-right' : 'fs-fb-wrong'));
      fb.appendChild(el('div', 'fs-fb-verdict', (right ? '正确 — ' : '不对 — ') + c.principle));
      fb.appendChild(el('div', 'fs-fb-why', c.why));
      var next = el('button', 'fs-btn fs-btn-primary', '下一题');
      next.onclick = function () { idx++; updateBar(); showCase(); };
      fb.appendChild(next);
      cardBox.appendChild(fb);
      updateBar();
    }

    updateBar(); showCase();
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-autodecide:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (n) { n.setAttribute('data-ready', '1'); build(n); });
  });
})();
