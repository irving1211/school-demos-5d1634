// Site behaviour: notice preview (?alert=delay|closure), the one moving detail (the "Today" sign flaps
// over when you arrive from another language), keeping your place when you switch language, print buttons.
(function () {
  'use strict';
  var D = document, ss;
  try { ss = window.sessionStorage; } catch (e) { ss = null; }
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) { if (D.readyState !== 'loading') fn(); else D.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    // 1. preview another notice variant
    var st = D.getElementById('status');
    var m = /[?&]alert=(delay|closure|normal)\b/.exec(location.search);
    if (st && m) {
      var v = JSON.parse(st.getAttribute('data-variants'))[m[1]];
      if (v) { st.setAttribute('data-state', m[1]); D.getElementById('st-msg').textContent = v.msg; D.getElementById('st-time').textContent = v.at; }
    }

    // 2. language switch: remember the old "Today" word and the scroll position, keep them across the page change
    var todayEl = D.querySelector('[data-today]');
    Array.prototype.forEach.call(D.querySelectorAll('.greet a[data-lang]'), function (a) {
      a.addEventListener('click', function () {
        if (!ss || a.getAttribute('aria-current') === 'true') return;
        try {
          if (todayEl) ss.setItem('mc-today', todayEl.textContent);
          var h = D.documentElement.scrollHeight - innerHeight;
          ss.setItem('mc-scroll', JSON.stringify({ path: a.pathname, r: h > 0 ? scrollY / h : 0 }));
          if (m) a.search = '?alert=' + m[1];
        } catch (e) {}
      });
    });
    if (ss) {
      try {
        var sc = JSON.parse(ss.getItem('mc-scroll') || 'null');
        if (sc && sc.path === location.pathname) { var H = D.documentElement.scrollHeight - innerHeight; scrollTo(0, Math.round(sc.r * H)); }
        ss.removeItem('mc-scroll');
        var old = ss.getItem('mc-today'); ss.removeItem('mc-today');
        if (old && todayEl && old !== todayEl.textContent && !RM && todayEl.animate) flap(todayEl, old);
      } catch (e) {}
    }

    // 3. print buttons
    Array.prototype.forEach.call(D.querySelectorAll('[data-print]'), function (b) { b.addEventListener('click', function () { window.print(); }); });
  });

  // The flap: the old word's top half folds down, the new word's bottom half folds up. 90 ms each. Nothing else moves.
  function flap(el, oldText) {
    var FL = 90, nw = el.getBoundingClientRect().width;
    var mk = function (c, t) { var s = D.createElement('span'); s.className = 'flap ' + c; s.textContent = t; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); return s; };
    var probe = mk('t', oldText); var ow = probe.getBoundingClientRect().width; probe.remove();
    if (ow > nw) el.style.minWidth = ow + 'px';
    var bo = mk('b', oldText), ft = mk('t', oldText), fb = mk('b', el.firstChild.textContent);
    setTimeout(function () {
      ft.animate([{ transform: 'perspective(80px) rotateX(0deg)' }, { transform: 'perspective(80px) rotateX(-90deg)' }], { duration: FL, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' });
      var a = fb.animate([{ transform: 'perspective(80px) rotateX(90deg)' }, { transform: 'perspective(80px) rotateX(0deg)' }], { duration: FL, delay: FL, easing: 'cubic-bezier(0,.55,.45,1)', fill: 'backwards' });
      setTimeout(function () { bo.remove(); }, FL);
      a.onfinish = function () { ft.remove(); fb.remove(); el.style.minWidth = ''; };
    }, 350);
  }
})();
