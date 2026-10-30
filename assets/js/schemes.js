(() => {
  /* =========================================================
     SCHEME SETTINGS: edit these to match the final scheme.
     ========================================================= */
  const SCHEME = {
    months: 11,
    minInstallment: 1000,       // smallest monthly amount accepted (Rs)
    step: 500,                  // monthly amount must be a multiple of this (Rs)
    // Benefit KGR adds at maturity, as a % of ONE monthly instalment.
    // e.g. 100 = one free instalment, 75 = 75% of one instalment.
    // Leave as null until the benefit is finalised; the page will say
    // "Shared at enrolment" instead of showing a number.
    benefitPercentOfOne: null,
    benefitText: 'Shared by our team at enrolment',
    redemptionText: 'Redeem for gold at KGR, Punalur',
    contactText: 'KGR head office, Punalur (use the form below)',
    contactEmail: ''            // inquiries go here by email once filled in
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const inr = v => '\u20B9' + Math.round(v).toLocaleString('en-IN');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- fill scheme facts ---------- */
  const facts = {
    installment: `From ${inr(SCHEME.minInstallment)} a month, in multiples of ${inr(SCHEME.step)}`,
    benefit: SCHEME.benefitPercentOfOne != null ? `${SCHEME.benefitPercentOfOne}% of one monthly instalment, added at maturity` : SCHEME.benefitText,
    redemption: SCHEME.redemptionText,
    contact: SCHEME.contactText,
    'faq-amount': `Yes. Pick any amount from ${inr(SCHEME.minInstallment)} a month, in multiples of ${inr(SCHEME.step)}. The amount stays the same for all 11 months.`
  };
  $$('[data-s]').forEach(el => { el.textContent = facts[el.dataset.s] || ''; });

  /* ---------- calculator ---------- */
  const amt = $('#amt'), rng = $('#amtRange'), stacks = $('#stacks');
  amt.min = rng.min = SCHEME.minInstallment; amt.step = rng.step = SCHEME.step;
  $('#amtHint').textContent = `Minimum ${inr(SCHEME.minInstallment)}, in steps of ${inr(SCHEME.step)}.`;
  const hasBonus = SCHEME.benefitPercentOfOne != null;
  stacks.innerHTML = Array.from({ length: SCHEME.months }, (_, i) =>
    `<span style="--h:${((i + 1) / (SCHEME.months + 1) * 100).toFixed(1)}%;--d:${(i * .05).toFixed(2)}s"><em>${i + 1}</em></span>`).join('')
    + `<span class="crown-col" style="--h:100%;--d:${(SCHEME.months * .05).toFixed(2)}s"><em>+</em></span>`;
  function calc(src) {
    let v = parseFloat(src.value) || 0;
    if (src === rng) amt.value = v; else rng.value = Math.min(Math.max(v, SCHEME.minInstallment), +rng.max);
    const ok = v >= SCHEME.minInstallment;
    const paid = v * SCHEME.months;
    $('#paid').textContent = ok ? inr(paid) : `Minimum ${inr(SCHEME.minInstallment)}`;
    if (hasBonus) {
      const b = v * SCHEME.benefitPercentOfOne / 100;
      $('#bonus').textContent = ok ? inr(b) : '\u2014';
      $('#total').textContent = ok ? inr(paid + b) : '\u2014';
    } else {
      $('#bonus').textContent = SCHEME.benefitText; $('#bonus').classList.add('soft');
      $('#total').innerHTML = ok ? `${inr(paid)}<small>plus your scheme benefit</small>` : '\u2014';
    }
  }
  amt.addEventListener('input', () => calc(amt));
  amt.addEventListener('change', () => { const s = SCHEME.step; let v = Math.max(SCHEME.minInstallment, Math.round((+amt.value || 0) / s) * s); amt.value = v; calc(amt); });
  rng.addEventListener('input', () => calc(rng));
  calc(amt);
  const calcSec = $('#calc');
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { calcSec.classList.add('in'); o.disconnect(); } }, { threshold: .3 }).observe(calcSec);

  /* ---------- FAQ accordion ---------- */
  const vals = $$('.val');
  vals.forEach(v => $('button', v).addEventListener('click', () => {
    const open = v.classList.contains('on');
    vals.forEach(x => { x.classList.remove('on'); $('button', x).setAttribute('aria-expanded', 'false'); });
    if (!open) { v.classList.add('on'); $('button', v).setAttribute('aria-expanded', 'true'); }
  }));

  /* ---------- nav + progress ---------- */
  const nav = $('#nav'), bar = $('#bar');
  const onScroll = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('solid', y > 24);
    bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h).toFixed(4) : 0})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  requestAnimationFrame(() => document.documentElement.classList.add('ready'));

  /* ---------- mobile menu ---------- */
  const burger = $('#burger');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- enrol form ---------- */
  const form = $('#form'), status = $('#status');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.name.trim() || !d.contact.trim()) { status.textContent = 'Please add your name and a phone number or email.'; return; }
    const body = `Name: ${d.name}\nContact: ${d.contact}\nMonthly amount: Rs ${d.amount || '-'}\nCity: ${d.city || '-'}\n\n${d.message || ''}`;
    if (SCHEME.contactEmail) {
      location.href = `mailto:${SCHEME.contactEmail}?subject=${encodeURIComponent('Golden Crown scheme enrolment')}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Opening your email app with your details.';
    } else {
      if (navigator.clipboard) navigator.clipboard.writeText(body).catch(() => {});
      status.textContent = 'Details copied. Online sending is not connected yet, so please share them with us at the address shown.';
    }
  });
})();