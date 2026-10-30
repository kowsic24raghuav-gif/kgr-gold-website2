(() => {
        const $ = (s, r = document) => r.querySelector(s);
        const $$ = (s, r = document) => [...r.querySelectorAll(s)];
        const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
        const lerp = (a, b, t) => a + (b - a) * t;
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
        const root = document.documentElement;

        /* ---------- intro sequence ---------- */
        const go = () => requestAnimationFrame(() => root.classList.add('ready'));
        const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        Promise.race([fontsReady, new Promise(r => setTimeout(r, 1400))]).then(go);

        /* ---------- gold dust / embers ---------- */
        function dust(canvas, o) {
          const ctx = canvas.getContext('2d');
          let W = 0, H = 0, parts = [], raf = 0, visible = false;
          const mouse = { x: -999, y: -999 };
          const spawn = (init) => ({
            x: Math.random() * W,
            y: init ? Math.random() * H : H + 12,
            r: Math.random() * o.size + .4,
            vy: -(Math.random() * o.speed + .08),
            vx: (Math.random() - .5) * .18,
            ph: Math.random() * 6.283,
            tw: Math.random() * .025 + .006
          });
          function resize() {
            const r = canvas.getBoundingClientRect();
            const dpr = Math.min(devicePixelRatio || 1, 2);
            W = r.width; H = r.height;
            canvas.width = W * dpr; canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.min(140, Math.round(W * H / o.density));
            parts = Array.from({ length: n }, () => spawn(true));
          }
          function frame() {
            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = 'source-over';
            for (const p of parts) {
              p.ph += p.tw;
              p.x += p.vx + Math.sin(p.ph) * .12;
              p.y += p.vy;
              const dx = p.x - mouse.x, dy = p.y - mouse.y, d = dx * dx + dy * dy;
              if (d < 16000) { const f = (1 - d / 16000) * 2, s = Math.sqrt(d) + 1; p.x += dx / s * f; p.y += dy / s * f; }
              if (p.y < -12) Object.assign(p, spawn(false));
              const a = (.3 + .7 * Math.abs(Math.sin(p.ph))) * o.alpha;
              ctx.fillStyle = `rgba(${o.rgb},${a.toFixed(3)})`;
              ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
            }
            raf = requestAnimationFrame(frame);
          }
          resize();
          addEventListener('resize', resize);
          new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            cancelAnimationFrame(raf);
            if (visible) frame();
          }).observe(canvas);
          if (fine) canvas.parentElement.addEventListener('pointermove', e => {
            const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
          });
        }
        if (!reduce) {
          dust($('#dust'), { rgb: '196,149,46', alpha: .55, density: 9000, speed: .35, size: 1.5 });
          dust($('#embers'), { rgb: '230,110,30', alpha: .5, density: 16000, speed: .9, size: 1.7 });
        }

        /* ---------- hero seal tilt ---------- */
        if (fine && !reduce) {
          const hero = $('#top'), tilt = $('#sealTilt');
          let tx = 0, ty = 0, cx = 0, cy = 0, on = false, id = 0;
          hero.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5;
          });
          hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
          const step = () => {
            cx = lerp(cx, tx, .06); cy = lerp(cy, ty, .06);
            tilt.style.setProperty('--ry', (cx * 16).toFixed(2) + 'deg');
            tilt.style.setProperty('--rx', (-cy * 14).toFixed(2) + 'deg');
            id = requestAnimationFrame(step);
          };
          new IntersectionObserver(([e]) => { cancelAnimationFrame(id); if (e.isIntersecting) step(); }).observe(hero);
        }

        /* ---------- marquee: duplicate for seamless loop ---------- */
        const track = $('#mqTrack');
        const first = $('.mq', track);
        const clone = first.cloneNode(true); clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);

        /* ---------- statement: words light up with scroll ---------- */
        const st = $('#statement');
        const words = st.textContent.trim().split(/\s+/);
        st.setAttribute('aria-label', st.textContent.trim());
        st.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
        const W = $$('.w', st);

        /* ---------- in-view reveals + count up ---------- */
        const fmt = (v, d) => v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
        function countUp(el) {
          const t = parseFloat(el.dataset.count), d = +(el.dataset.dec || 0);
          if (reduce) { el.textContent = fmt(t, d); return; }
          const s = performance.now(), dur = 1600;
          (function f(n) {
            const k = clamp((n - s) / dur), e = 1 - Math.pow(1 - k, 3);
            el.textContent = fmt(t * e, d);
            if (k < 1) requestAnimationFrame(f);
          })(s);
        }
        const io = new IntersectionObserver(es => es.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in'); io.unobserve(e.target);
          $$('[data-count]', e.target).forEach(countUp);
        }), { threshold: .3 });
        $$('.io').forEach(el => io.observe(el));

        /* ---------- services ---------- */
        const items = $$('.svc-item'), imgs = $$('.svc-img');
        let cur = 0, z = 1;
        function setSvc(i) {
          if (i === cur) return;
          cur = i;
          items.forEach((it, k) => { it.classList.toggle('on', k === i); $('.svc-btn', it).setAttribute('aria-expanded', k === i); });
          imgs.forEach((im, k) => {
            if (k === i) { im.style.zIndex = ++z; im.classList.add('on'); }
            else if (im.classList.contains('on')) setTimeout(() => { if (k !== cur) im.classList.remove('on'); }, 1050);
          });
        }
        items.forEach((it, i) => {
          const b = $('.svc-btn', it);
          b.addEventListener('click', () => setSvc(i));
          b.addEventListener('focus', () => setSvc(i));
          if (fine) b.addEventListener('mouseenter', () => setSvc(i));
        });

        /* ---------- reasons accordion ---------- */
        const vals = $$('.val');
        vals.forEach(v => $('button', v).addEventListener('click', () => {
          const open = v.classList.contains('on');
          vals.forEach(x => { x.classList.remove('on'); $('button', x).setAttribute('aria-expanded', 'false'); });
          if (!open) { v.classList.add('on'); $('button', v).setAttribute('aria-expanded', 'true'); }
        }));

        /* ---------- pinned refining sequence ---------- */
        const proc = $('#process'), layers = $$('.layer', $('#frameBox')), front = $('#front'), glow = $('#pfGlow');
        const steps = $$('#steps li'), panels = $$('.panel'), fill = $('#meterFill'), pv = $('#pv');
        const labels = ['Alloy', 'Refining', '99.5% or more', '99.9%'];
        let stage = -1;
        const ember = [255, 107, 31], gold = [226, 176, 74];
        function updateProc() {
          const r = proc.getBoundingClientRect();
          const total = proc.offsetHeight - innerHeight;
          if (r.bottom < -50 || r.top > innerHeight + 50) return;
          const p = clamp(-r.top / total), p3 = p * 3;
          let frontY = null;
          layers.forEach((l, i) => {
            const img = $('img', l);
            if (i === 0) { img.style.transform = `scale(${(1.1 - .1 * clamp(p3 / .6)).toFixed(4)})`; return; }
            const rv = clamp((p3 - (i - .6)) / .5);
            l.style.clipPath = `inset(${((1 - rv) * 100).toFixed(2)}% 0 0 0)`;
            img.style.transform = `scale(${(1.12 - .12 * rv).toFixed(4)})`;
            if (rv > 0 && rv < 1) frontY = (1 - rv) * 100;
          });
          if (frontY === null) front.style.opacity = 0;
          else { front.style.opacity = 1; front.style.top = `calc(${frontY.toFixed(2)}% - 1px)`; }
          fill.style.transform = `scaleX(${p.toFixed(4)})`;
          const t = clamp(p3 / 3), c = ember.map((v, k) => Math.round(lerp(v, gold[k], t)));
          glow.style.setProperty('--glow', `rgba(${c[0]},${c[1]},${c[2]},${(.42 - .12 * t).toFixed(2)})`);
          const s = clamp(Math.round(p3), 0, 3);
          if (s !== stage) {
            stage = s;
            steps.forEach((li, k) => { li.classList.toggle('on', k === s); li.classList.toggle('done', k < s); });
            panels.forEach((pn, k) => pn.classList.toggle('on', k === s));
            pv.textContent = labels[s];
          }
        }

        /* ---------- scroll handler ---------- */
        const nav = $('#nav'), bar = $('#bar');
        let ticking = false;
        function onScroll() {
          ticking = false;
          const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
          nav.classList.toggle('solid', y > 24);
          bar.style.transform = `scaleX(${h > 0 ? clamp(y / h).toFixed(4) : 0})`;
          // statement
          if (reduce) W.forEach(w => w.style.opacity = 1);
          else {
            const r = st.getBoundingClientRect(), vh = innerHeight;
            const p = clamp((vh * .88 - r.top) / (vh * .5 + r.height));
            const n = p * (W.length + 8);
            W.forEach((w, i) => { w.style.opacity = (.35 + clamp((n - i) / 4) * .65).toFixed(3); });
          }
          updateProc();
        }
        const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
        addEventListener('scroll', req, { passive: true });
        addEventListener('resize', req);
        onScroll();

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

        /* ---------- inquiry form ---------- */
        // Add the company's inquiry email address here to send inquiries by email.
        const CONTACT_EMAIL = '';
        const form = $('#form'), status = $('#status');
        form.addEventListener('submit', e => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(form).entries());
          if (!d.name.trim() || !d.contact.trim()) { status.textContent = 'Please add your name and an email or phone number.'; return; }
          const body = `Name: ${d.name}\nCompany: ${d.company || '-'}\nContact: ${d.contact}\nInterested in: ${d.topic}\n\n${d.message || ''}`;
          if (CONTACT_EMAIL) {
            location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Inquiry: ' + d.topic)}&body=${encodeURIComponent(body)}`;
            status.textContent = 'Opening your email app with the inquiry.';
          } else {
            if (navigator.clipboard) navigator.clipboard.writeText(body).catch(() => { });
            status.textContent = 'Inquiry copied. Online sending is not connected yet, so please send it to us at the address shown.';
          }
        });
      })();