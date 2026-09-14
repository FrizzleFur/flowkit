/* fs-funnel 吞噬漏斗 — panel-review.md Auto-Decide Layer 的批量第二幕
 * 规则源: skills/flow-deep/references/panel-review.md:197-278（P1→P6 顺序判定, 命中即停——不用 README 旧图语义）
 * 用法: <div class="fs-funnel"></div>
 *
 * 数据: 20 条教学化评审发现, 出口分布对账（每条 p/exit 均按规则源逐条推得）:
 *   AUTO(12, 被漏斗吞掉):
 *     #01-04 P1 行业标准(输入验证缺失/日志无请求ID/错误处理不一/未处理空数组)——:201-205 原文示例命中即停
 *     #05,06,07,08,09,12 P2·LOW(命名不一/注释过期/文案错字/日志级别混用/文档漂移/魔法数字)——P2 表 LOW 行「静默记录」
 *     #10,11 P2·MEDIUM(死代码/重复工具函数)——P2 表 MEDIUM 行「记录但不阻塞」
 *   TASTE(5, 穿过漏斗入托盘):
 *     #13,14 P6·例外条款(schema 变更/API 协议变更)——:249 例外「不论文件数一律上浮」
 *     #15 P6·不可逆(影响面≥3 文件)——P6 表「>=3 文件 → TASTE_DECISION」
 *     #16,17 P5·安全 MEDIUM(rate limiting 建议/CORS 过宽)——:218「安全 MEDIUM 不归 P2 的 AUTO, 继续走到 P5」
 *   BLOCKED(3, 撞墙拦停在闸口):
 *     #18-20 P2·CRITICAL(密钥入日志/SQL 拼接/越权路径)——P2 表 CRITICAL 行「直接阻塞」
 *   顺序判定对账: TASTE 五条在 P1-P4 均无命中(安全两条按 :218 跳过 P2 的 AUTO 分支续行), 于 P5/P6 墙被兜住——与 :253-278 判定流程一致
 *
 * 动效: 播放逐张倒入(translateY+fade 入场; 间隔 TICK/speed, 4x 时 90ms/张即规格的「90ms stagger」倾泻);
 *       AUTO 卡命中墙缩小+褪色(scale .6 + opacity .25, 600ms)且墙上浮原则标签; TASTE 卡穿墙弹入托盘(回弹 easing);
 *       BLOCKED 卡撞墙抖动后红框停在闸口; 计数器实时翻动; 播完出结论条「决策疲劳: 20→5, 你只需要裁决 5 条」
 * 生命周期: 计时器统一入 st.timers, 经 root._fsClear 托管; 重初始化先清再建(照 replay.js/hero.js 模式)
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  var TICK = 360;       // 播放逐张间隔(ms, 除以 speed)——4x 时 90ms/张
  var SPEEDS = [0.5, 1, 2, 4];
  var WALLS = ['P1 行业标准 · P2 风险分级', 'P3 已批决策一致性 · P4 YAGNI', 'P5 安全一律上浮 · P6 可逆性'];

  var FINDS = [
    { t: '输入验证缺失', f: '采集脚本缺少输入验证，直接拼接用户参数', p: 'P1·行业标准', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '有明确行业最佳实践答案——命中即停，自动采纳并记录' },
    { t: '日志无请求 ID', f: '日志缺少请求 ID，无法串联一次调用的全链路', p: 'P1·行业标准', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '日志打点有公认做法（request ID 透传），自动补上' },
    { t: '错误处理不一', f: '错误处理风格不统一（有的抛异常有的返回 null）', p: 'P1·行业标准', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '错误处理有行业标准答案，统一为一种风格' },
    { t: '未处理空数组', f: '列表渲染未处理空数组，空数据时出现空白页', p: 'P1·行业标准', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '空态处理是行业惯例，补空态提示即可' },
    { t: '命名不一', f: '变量命名 snake/camel 混用', p: 'P2·LOW', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '命名/格式/注释类属 LOW——静默记录，不阻塞不上浮' },
    { t: '注释过期', f: '三处注释与实现已不一致（重构后未同步）', p: 'P2·LOW', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '注释类 LOW 级静默记录' },
    { t: '文案错字', f: '设置页两处文案错字', p: 'P2·LOW', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '微小修改 LOW 级静默记录' },
    { t: '日志级别混用', f: '日志级别混用（把 error 当 warn 打）', p: 'P2·LOW', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '日志规范属 LOW 级静默记录' },
    { t: '文档漂移', f: 'README 接口文档与实际返回结构漂移', p: 'P2·LOW', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '文档同步属 LOW 级静默记录' },
    { t: '死代码', f: '两个从未被调用的导出函数', p: 'P2·MEDIUM', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '一般可维护性问题 MEDIUM——记录但不阻塞' },
    { t: '重复工具函数', f: '日期格式化函数在两个模块各写了一份', p: 'P2·MEDIUM', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '可维护性问题 MEDIUM——记录但不阻塞' },
    { t: '魔法数字', f: '超时时间 86400 以魔法数字散落三处', p: 'P2·LOW', exit: 'AUTO', tag: 'AUTO_APPROVED', why: '提取为具名常量——LOW 级静默记录' },
    { t: 'schema 变更', f: '数据库 schema 变更（新增字段 + 索引调整）', p: 'P6·例外条款', exit: 'TASTE', tag: '[IRREVERSIBLE]', why: 'P6 例外: schema 变更不论文件数一律上浮——先读例外再数文件' },
    { t: 'API 协议变更', f: 'API 响应包裹结构变更（影响所有调用方）', p: 'P6·例外条款', exit: 'TASTE', tag: '[IRREVERSIBLE]', why: '公共协议变更属 P6 例外条款，一律上浮' },
    { t: '影响面 ≥3 文件', f: '统一 5 个文件的接口签名', p: 'P6·不可逆', exit: 'TASTE', tag: '[IRREVERSIBLE]', why: '影响面 ≥3 文件（跨模块/接口变更）——不可逆，上浮' },
    { t: 'rate limiting', f: '建议为公开端点补充 rate limiting', p: 'P5·安全上浮', exit: 'TASTE', tag: '[SECURITY]', why: '安全 MEDIUM 不走 P2 的 AUTO——续行到 P5，安全问题不自动处理' },
    { t: 'CORS 过宽', f: 'CORS 允许任意来源，建议按域收敛', p: 'P5·安全上浮', exit: 'TASTE', tag: '[SECURITY]', why: '同上——P5 兜住所有安全 MEDIUM，一律上浮' },
    { t: '密钥入日志', f: 'API 密钥可能出现在日志输出中', p: 'P2·CRITICAL', exit: 'BLOCKED', tag: 'BLOCKED', why: '数据泄露风险——CRITICAL 在 P2 直接阻塞，不进入后续判定' },
    { t: 'SQL 拼接', f: '报表查询存在 SQL 字符串拼接（注入面）', p: 'P2·CRITICAL', exit: 'BLOCKED', tag: 'BLOCKED', why: '注入风险即安全漏洞——直接阻塞，修复前不得合并' },
    { t: '越权路径', f: '管理接口未校验角色，存在越权访问路径', p: 'P2·CRITICAL', exit: 'BLOCKED', tag: 'BLOCKED', why: '越权属 CRITICAL 安全漏洞——直接阻塞' }
  ];

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build(root) {
    root.textContent = '';
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var head = el('div', 'fs-funnel-head');
    head.appendChild(el('span', 'fs-funnel-title', '吞噬漏斗 · 批量评审'));
    var counts = el('div', 'fs-fn-counts');
    function counter(label) {
      var c = el('span', 'fs-fn-count', label);
      var b = el('b', null, '0');
      c.appendChild(b);
      counts.appendChild(c);
      return b;
    }
    var nEat = counter('吞'), nTray = counter('托盘'), nBlk = counter('拦');
    head.appendChild(counts);
    root.appendChild(head);

    var ctrl = el('div', 'fs-funnel-ctrl');
    var play = el('button', 'fs-btn fs-btn-primary', '播放');
    var step = el('button', 'fs-btn', '单步');
    var resetBtn = el('button', 'fs-btn', '重置');
    var speed = el('select', 'fs-replay-speed');
    SPEEDS.forEach(function (sp) { var o = el('option', null, sp + 'x'); o.value = sp; if (sp === 1) o.selected = true; speed.appendChild(o); });
    ctrl.appendChild(play); ctrl.appendChild(step); ctrl.appendChild(resetBtn); ctrl.appendChild(speed);
    root.appendChild(ctrl);

    var stage = el('div', 'fs-funnel-stage');
    var stream = el('div', 'fs-fn-stream');
    stream.appendChild(el('span', 'fs-fn-slabel', '发现流'));
    var streamTxt = el('span', 'fs-fn-stext', '— 等待倒入 20 条发现 —');
    stream.appendChild(streamTxt);
    stage.appendChild(stream);
    var walls = el('div', 'fs-fn-walls');
    var wallEls = WALLS.map(function (w) {
      var d = el('div', 'fs-fn-wall');
      d.appendChild(el('span', 'fs-fn-wallname', w));
      var slot = el('span', 'fs-fn-ptag', '');
      d.appendChild(slot);
      walls.appendChild(d);
      return { d: d, slot: slot };
    });
    stage.appendChild(walls);
    var exits = el('div', 'fs-fn-exits');
    var tray = el('div', 'fs-fn-exit fs-fn-tray');
    tray.appendChild(el('div', 'fs-fn-exit-title', '用户托盘 · TASTE_DECISION'));
    var trayList = el('div', 'fs-fn-tlist');
    tray.appendChild(trayList);
    var eatBox = el('div', 'fs-fn-exit fs-fn-eatbox');
    eatBox.appendChild(el('div', 'fs-fn-exit-title', '已吞 · AUTO_APPROVED'));
    var eatList = el('div', 'fs-fn-tlist');
    eatBox.appendChild(eatList);
    var gate = el('div', 'fs-fn-exit fs-fn-gate');
    gate.appendChild(el('div', 'fs-fn-exit-title', '阻塞 · BLOCKED（闸口）'));
    exits.appendChild(tray); exits.appendChild(eatBox); exits.appendChild(gate);
    stage.appendChild(exits);
    var air = el('div', 'fs-fn-air');   // 飞行卡覆盖层: 覆盖墙+出口区, pointer-events none
    stage.appendChild(air);
    root.appendChild(stage);

    var note = el('div', 'fs-fn-note', '　');
    root.appendChild(note);
    var done = el('div', 'fs-fn-done');
    root.appendChild(done);

    /* ---------- 引擎（计时器全部入 st.timers, 由 root._fsClear 统一托管） ---------- */
    var st = { gen: 0, timers: [], i: 0, playing: false, fin: false, speed: 1 };
    var eaten = 0, trayed = 0, blocked = 0;

    function after(ms, fn) {
      var g = st.gen;
      var id = setTimeout(function () {
        var k = st.timers.indexOf(id);
        if (k >= 0) st.timers.splice(k, 1);
        if (g === st.gen) fn();
      }, ms);
      st.timers.push(id);
    }
    function bump(b, n) {
      b.textContent = n;
      b.classList.remove('fs-fn-bump');
      void b.offsetWidth;
      b.classList.add('fs-fn-bump');
    }
    function flashTag(wallIdx, text) {
      var s = wallEls[wallIdx].slot;
      s.textContent = text;
      s.style.visibility = 'visible';
      s.style.animation = 'none';
      void s.offsetWidth;
      s.style.animation = '';
    }
    function geom() {
      return {
        w: stage.clientWidth,
        streamY: stream.offsetTop + 6,
        w0: wallEls[0].d.offsetTop + 4,
        w2: wallEls[2].d.offsetTop + 4,
        trayX: tray.offsetLeft + 12, trayY: tray.offsetTop + 32,
        gateX: gate.offsetLeft + 12, gateY: gate.offsetTop + 30
      };
    }
    function trayRow(f, cls) {
      var row = el('div', 'fs-fn-trow' + (cls ? ' ' + cls : ''));
      row.appendChild(el('span', 'fs-fn-ttag', f.tag));
      row.appendChild(el('span', null, f.t));
      return row;
    }

    function resolve(card, f, i, pos) {
      note.textContent = f.t + ' → ' + f.p + ' ' + f.tag + ' — ' + f.why;
      if (f.exit === 'AUTO') {
        eaten++;
        flashTag(0, f.p + ' · 吞');
        card.classList.add('fs-fn-dim');
        card.style.transition = 'transform .6s ease, opacity .6s ease';   // 吞掉动词: 600ms
        card.style.transform = 'translate(' + (pos.x - card._sx) + 'px,' + (pos.y - card._sy) + 'px) scale(.6)';
        card.style.opacity = '.25';
        bump(nEat, eaten);
      } else if (f.exit === 'BLOCKED') {
        blocked++;
        var slot = (blocked - 1) % 3, row = Math.floor((blocked - 1) / 3);
        flashTag(0, f.p + ' · 拦停');
        card.classList.add('fs-fn-shake', 'fs-fn-red');
        bump(nBlk, blocked);
        after(440, function () {   // 抖动后红框停在闸口
          var g2 = geom();
          card.classList.remove('fs-fn-shake');
          card.style.transition = 'transform .45s ease';
          card.style.transform = 'translate(' + (g2.gateX + slot * 52 - card._sx) + 'px,' + (g2.gateY + row * 34 - card._sy) + 'px)';
        });
      } else {   // TASTE: 墙上浮标签 → 穿墙弹入托盘
        flashTag(2, f.p + ' · 上浮');
        after(260, function () {
          var g2 = geom();
          card.style.transition = 'transform .55s cubic-bezier(.34,1.56,.64,1), opacity .3s';   // 弹跳 easing
          card.style.transform = 'translate(' + (g2.trayX - card._sx) + 'px,' + (g2.trayY - card._sy) + 'px)';
          after(560, function () {
            trayed++;
            trayList.appendChild(trayRow(f, ''));
            if (card.parentNode) card.parentNode.removeChild(card);
            bump(nTray, trayed);
          });
        });
      }
    }

    function launch(i) {
      var f = FINDS[i], g = geom();
      streamTxt.textContent = (i + 1) + '/' + FINDS.length + ' · ' + f.f;
      var card = el('div', 'fs-fn-card');
      card.appendChild(el('div', 'fs-fn-cardin', f.t));
      var cx = Math.max(8, g.w / 2 - 66);
      card._sx = cx; card._sy = g.streamY;
      card.style.left = cx + 'px';
      card.style.top = g.streamY + 'px';
      air.appendChild(card);
      var pos;
      if (f.exit === 'TASTE') pos = { x: Math.max(8, g.w / 2 - 66), y: g.w2 };
      else pos = { x: g.w / 2 - 66 + ((i * 37) % 56) - 28, y: g.w0 + (eaten % 5) * 3 };
      after(40, function () {   // 入场(translateY+fade 由 CSS 动画)后落向命中墙
        card.style.transform = 'translate(' + (pos.x - cx) + 'px,' + (pos.y - g.streamY) + 'px)';
      });
      after(430, function () { resolve(card, f, i, pos); });
    }

    function finish() {
      if (st.fin) return;
      st.fin = true;
      after(650, function () {
        done.textContent = '决策疲劳: 20→5, 你只需要裁决 5 条';
        done.classList.add('fs-fn-done-on');
      });
    }
    function advance() {
      if (st.i >= FINDS.length) { st.playing = false; play.textContent = '播放'; finish(); return; }
      launch(st.i); st.i++;
    }
    function tick() {
      if (!st.playing) return;
      advance();
      if (st.playing) after(TICK / st.speed, tick);
    }
    function stopPlay() { st.playing = false; play.textContent = '播放'; }
    function resetRun() {
      st.gen++; stopPlay();
      st.timers.forEach(clearTimeout); st.timers = [];
      st.i = 0; st.fin = false; eaten = 0; trayed = 0; blocked = 0;
      air.textContent = ''; trayList.textContent = ''; eatList.textContent = '';
      nEat.textContent = '0'; nTray.textContent = '0'; nBlk.textContent = '0';
      wallEls.forEach(function (w) { w.slot.style.visibility = 'hidden'; w.slot.textContent = ''; });
      streamTxt.textContent = '— 等待倒入 20 条发现 —';
      note.textContent = '　';
      done.classList.remove('fs-fn-done-on'); done.textContent = '';
    }

    play.onclick = function () {
      if (st.playing) { stopPlay(); return; }
      if (st.i >= FINDS.length) resetRun();
      st.playing = true; play.textContent = '暂停';
      tick();
    };
    step.onclick = function () { stopPlay(); advance(); };
    resetBtn.onclick = resetRun;
    speed.onchange = function () { st.speed = parseFloat(speed.value); };

    /* ---------- reduce-motion: 全部静态陈列 + 颜色区分（不建引擎, 零计时器） ---------- */
    if (reduced) {
      root.classList.add('fs-fn-static');
      var gateList = el('div', 'fs-fn-tlist');   // gate 无独立 list 容器, 静态陈列直接落 box
      gate.appendChild(gateList);
      FINDS.forEach(function (f) {
        var cls = f.exit === 'BLOCKED' ? 'fs-fn-trow-red' : (f.exit === 'AUTO' ? 'fs-fn-trow-dim' : '');
        (f.exit === 'AUTO' ? eatList : f.exit === 'TASTE' ? trayList : gateList).appendChild(trayRow(f, cls));
      });
      nEat.textContent = '12'; nTray.textContent = '5'; nBlk.textContent = '3';
      done.textContent = '决策疲劳: 20→5, 你只需要裁决 5 条';
      done.classList.add('fs-fn-done-on');
      note.textContent = '已按出口静态陈列: 灰=吞(AUTO) · 黄=托盘(TASTE) · 红=拦停(BLOCKED)';
      root._fsClear = function () {};
      return;
    }

    root._fsClear = function () {
      st.gen++; st.playing = false;
      st.timers.forEach(clearTimeout); st.timers = [];
    };
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.fs-funnel:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (root) {
      root.setAttribute('data-ready', '1');
      if (root._fsClear) root._fsClear();   // 清旧引擎计时器（防重挂载泄漏）
      build(root);
    });
  });
})();
