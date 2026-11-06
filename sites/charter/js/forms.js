// Form behaviour for the sample site: validate, show errors in place, guard double submits,
// simulate a send. ?fail=1 forces the failure state; being offline shows the offline state.
// Nothing is sent anywhere: on success the browser goes to the form's thank-you page.
(function () {
  'use strict';
  var forms = document.querySelectorAll('form[data-form]');
  var forceFail = /[?&]fail=1\b/.test(location.search);
  Array.prototype.forEach.call(forms, function (form) {
    var msgs = JSON.parse(form.getAttribute('data-msgs'));
    var box = document.getElementById(form.getAttribute('data-msgbox'));
    var btn = form.querySelector('button[type=submit]');
    var btnLabel = btn.querySelector('.rl') || btn;
    var label0 = btnLabel.textContent;
    var busy = false;

    function labelOf(input) {
      var l = form.querySelector('label[for="' + input.id + '"]');
      return l ? l.childNodes[0].textContent.trim() : input.name;
    }
    function setErr(input, text) {
      var f = input.closest('.field'), e = document.getElementById(input.id + '-err');
      if (text) { f.setAttribute('data-invalid', ''); input.setAttribute('aria-invalid', 'true'); if (e) e.textContent = text; }
      else { f.removeAttribute('data-invalid'); input.removeAttribute('aria-invalid'); if (e) e.textContent = ''; }
    }
    function check(input) {
      var v = (input.value || '').trim(), r = input.getAttribute('data-rule');
      if (!r) return '';
      if (r !== 'email-optional' && !v) return msgs.required.replace('{f}', labelOf(input));
      if (r === 'phone' && v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').length !== 10) return msgs.phone;
      if (r === 'email-optional' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return msgs.email;
      if (r === 'zip' && !/^\d{5}(-\d{4})?$/.test(v)) return msgs.zip;
      if (r === 'dob' && !(v >= '2012-01-01' && v <= '2023-12-31')) return msgs.dob;
      if (r === 'reach' && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.replace(/\D/g, '').length >= 10)) return msgs.reach;
      return '';
    }
    function show(html) { box.innerHTML = html; box.hidden = false; box.focus(); }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    // re-check a field when the visitor leaves it, once it has been flagged
    form.addEventListener('blur', function (e) {
      var i = e.target; if (i.closest && i.closest('.field[data-invalid]')) setErr(i, check(i));
    }, true);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return; // double-submit guard
      var bad = [];
      Array.prototype.forEach.call(form.querySelectorAll('[data-rule]'), function (i) {
        var m = check(i); setErr(i, m); if (m) bad.push({ i: i, m: m });
      });
      if (bad.length) {
        show('<p><strong>' + esc(msgs.summary.replace('{n}', bad.length)) + '</strong></p><ul>' + bad.map(function (b) { return '<li><a href="#' + b.i.id + '">' + esc(b.m) + '</a></li>'; }).join('') + '</ul>');
        box.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); document.getElementById(a.getAttribute('href').slice(1)).focus(); }); });
        return;
      }
      busy = true; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btnLabel.textContent = msgs.sending;
      box.hidden = true;
      setTimeout(function () {
        if (!navigator.onLine) return fail(msgs.offline);
        if (forceFail) return fail(msgs.fail);
        try { sessionStorage.setItem('mc-sent', '1'); } catch (x) {}
        location.href = form.getAttribute('data-success');
      }, 700);
    });
    function fail(text) {
      busy = false; btn.disabled = false; btn.removeAttribute('aria-busy'); btnLabel.textContent = label0;
      show('<p><strong>' + esc(text) + '</strong></p>');
    }
  });
})();
