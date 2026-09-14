/* fs-quiz 形成性自测 — Brown 规则（rust-book.cs.brown.edu 实证形态）:
 *   答错可原地换选重试（错选项锁定）; 两次不对出现「看解析」; 作答记录入 localStorage 供改稿参考。
 * 用法: <div class="fs-quiz" data-quiz="assets/quiz/ch4.json"></div>
 * 剧本 schema: { title, questions: [{ q, options:[...], answer: <正确项下标>, why }] }
 * 生命周期: fetch + 事件绑定, 无 timer; data-ready 防重入。
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };
  var STORE = 'fs-quiz-v1';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function loadStore() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
  function saveStore(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) {} }

  function build(root) {
    var src = root.getAttribute('data-quiz');
    var quizId = (src || '').split('/').pop().replace('.json', '');
    fetch(src).then(function (r) { return r.json(); }).then(function (data) {
      run(root, data, quizId);
    }).catch(function (e) {
      root.textContent = '';
      root.appendChild(el('div', 'fs-replay-err', 'quiz 加载失败: ' + e.message + '（需通过 HTTP 服务预览）'));
    });
  }

  function run(root, data, quizId) {
    var qs = data.questions || [];
    var store = loadStore();
    var rec = store[quizId] = store[quizId] || { firstTry: 0, seen: {}, rounds: 0, ts: Date.now() };
    var qi = 0, firstTry = 0;

    var bar = el('div', 'fs-qz-bar');
    var prog = el('span', 'fs-qz-prog');
    var stat = el('span', 'fs-qz-score');
    bar.appendChild(prog); bar.appendChild(stat);
    root.appendChild(bar);
    var card = el('div', 'fs-qz-card');
    root.appendChild(card);

    function ask(i) {
      card.textContent = '';
      var q = qs[i];
      var wrongTries = 0, solved = false;
      prog.textContent = '第 ' + (i + 1) + ' / ' + qs.length + ' 题';
      stat.textContent = '一次答对 ' + firstTry;
      card.appendChild(el('div', 'fs-qz-q', q.q));
      var opts = el('div', 'fs-qz-opts');
      var fbHost = el('div');
      card.appendChild(opts);
      card.appendChild(fbHost);
      var buttons = q.options.map(function (opt, oi) {
        var b = el('button', 'fs-qz-opt', opt);
        b.onclick = function () {
          if (solved) return;
          if (oi === q.answer) {
            solved = true;
            if (wrongTries === 0) firstTry++;
            b.classList.add('fs-opt-right');
            fbHost.textContent = '';
            var fb = el('div', 'fs-qz-fb fs-fb-right');
            fb.appendChild(el('div', 'fs-fb-verdict', (wrongTries === 0 ? '答对 — ' : '对 — ') + q.why));
            var nxt = el('button', 'fs-btn fs-btn-primary', i === qs.length - 1 ? '看总结' : '下一题');
            nxt.onclick = function () { i + 1 < qs.length ? ask(i + 1) : end(); };
            fb.appendChild(nxt);
            fbHost.appendChild(fb);
            rec.firstTry = firstTry; rec.ts = Date.now(); saveStore(store);
          } else {
            wrongTries++;
            b.classList.add('fs-opt-wrong');
            b.disabled = true;
            fbHost.textContent = '';
            var fb = el('div', 'fs-qz-fb fs-fb-wrong');
            fb.appendChild(el('div', 'fs-fb-verdict', wrongTries === 1 ? '不对——这个选项已被锁住, 换一个再试' : '仍不对——先回正文看对应小节, 或直接看解析'));
            if (wrongTries >= 2) {
              var see = el('button', 'fs-btn', '看解析');
              see.onclick = function () {
                rec.seen[i] = true; saveStore(store);
                solved = true;
                buttons[q.answer].classList.add('fs-opt-right');
                fbHost.textContent = '';
                var fb2 = el('div', 'fs-qz-fb fs-fb-right');
                fb2.appendChild(el('div', 'fs-fb-verdict', '解析 — ' + q.why));
                var nxt2 = el('button', 'fs-btn fs-btn-primary', i === qs.length - 1 ? '看总结' : '下一题');
                nxt2.onclick = function () { i + 1 < qs.length ? ask(i + 1) : end(); };
                fb2.appendChild(nxt2);
                fbHost.appendChild(fb2);
              };
              fb.appendChild(see);
            }
            fbHost.appendChild(fb);
          }
        };
        return b;
      });
      buttons.forEach(function (b) { opts.appendChild(b); });
    }

    function end() {
      card.textContent = '';
      var good = firstTry === qs.length;
      card.appendChild(el('div', 'fs-qz-done', '完成: 一次答对 ' + firstTry + ' / ' + qs.length +
        (good ? ' —— 全对, 本章机制已内化' : ' —— 错题回顾正文对应小节, 再来一轮')));
      var again = el('button', 'fs-btn fs-btn-primary', '重新测一遍');
      again.onclick = function () { firstTry = 0; ask(0); };
      card.appendChild(again);
      prog.textContent = '本章自测';
    }

    ask(0);
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-quiz[data-quiz]:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (n) { n.setAttribute('data-ready', '1'); build(n); });
  });
})();
