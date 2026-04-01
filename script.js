
(function () {

    /* THEME */
    const TK = 'nf-theme2'; let dark = false;
    function applyTheme(d) {
        dark = d; document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
        const ic = d ? '☀️' : '🌙';
        document.getElementById('themeBtn').textContent = ic;
        document.getElementById('fabTheme').textContent = ic;
        localStorage.setItem(TK, d ? 'dark' : 'light');
    }
    const sv = localStorage.getItem(TK);
    applyTheme(sv ? sv === 'dark' : window.matchMedia('(prefers-color-scheme:dark)').matches);
    document.getElementById('themeBtn').onclick = () => applyTheme(!dark);
    document.getElementById('fabTheme').onclick = () => applyTheme(!dark);
    window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', e => { if (!localStorage.getItem(TK)) applyTheme(e.matches) });

    /* LOADER */
    window.addEventListener('load', () => {
        setTimeout(() => {
            const l = document.getElementById('ldr'); l.classList.add('out');
            setTimeout(() => { l.style.display = 'none'; document.querySelectorAll('.gc').forEach((c, i) => setTimeout(() => c.classList.add('vis'), i * 100)) }, 700);
        }, 1700);
    });

    /* CHAPTERS — source of truth */
    const chapters = Array.from(document.querySelectorAll('.chapter'));
    const TOTAL = chapters.length;
    const chIds = chapters.map(c => c.id);
    const chTitles = chapters.map(c => c.querySelector('h2').textContent);

    /* NAV HEIGHT for offsets */
    const NAV_H = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 62;

    function scrollTo(id) {
        const el = document.getElementById(id); if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - NAV_H() - 14;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    /* BUILD LEFT SIDEBAR — dynamic, categorised folders */
    const navTree = document.getElementById('navTree');
    const cats = {};
    chapters.forEach(c => { const cat = c.dataset.category || 'General'; if (!cats[cat]) cats[cat] = []; cats[cat].push(c) });
    Object.entries(cats).forEach(([cat, items]) => {
        const folder = document.createElement('div'); folder.className = 'nf';
        const btn = document.createElement('button'); btn.className = 'fb open';
        btn.innerHTML = `<span>${cat}</span><span class="fa">›</span>`;
        btn.onclick = () => btn.classList.toggle('open');
        const fi = document.createElement('div'); fi.className = 'fi';
        items.forEach(c => {
            const a = document.createElement('a'); a.className = 'ni'; a.href = '#' + c.id; a.dataset.section = c.id;
            a.innerHTML = `<span class="nd"></span>${c.querySelector('h2').textContent}`;
            a.addEventListener('click', e => { e.preventDefault(); scrollTo(c.id) });
            fi.appendChild(a);
        });
        folder.appendChild(btn); folder.appendChild(fi); navTree.appendChild(folder);
    });

    /* BUILD MOBILE BOTTOM NAV */
    const botNav = document.getElementById('botNav');
    const bIcons = ['◈', '⬡', '◎', '⟿', '⊟'];
    chapters.forEach((c, i) => {
        const a = document.createElement('a'); a.className = 'bni'; a.href = '#' + c.id; a.dataset.section = c.id;
        a.innerHTML = `<span class="bic">${bIcons[i] || '·'}</span>${chTitles[i].split(' ')[0]}`;
        a.addEventListener('click', e => { e.preventDefault(); scrollTo(c.id) });
        botNav.appendChild(a);
    });

    /* BUILD RIGHT SIDEBAR — OUTLINE */
    const outlineList = document.getElementById('outlineList');
    chapters.forEach((c, i) => {
        const a = document.createElement('a'); a.className = 'oli'; a.href = '#' + c.id; a.dataset.section = c.id;
        a.innerHTML = `<span class="oln">0${i + 1}</span>${chTitles[i]}`;
        a.addEventListener('click', e => { e.preventDefault(); scrollTo(c.id) });
        outlineList.appendChild(a);
    });

    /* BUILD RIGHT SIDEBAR — GLOSSARY */
    const glossary = [
        { t: 'Node', d: 'Any device connected to a network — laptops, phones, printers, servers.' },
        { t: 'Router', d: 'Directs packets between networks; connects your LAN to the internet.' },
        { t: 'Switch', d: 'Connects devices within a single LAN, forwarding data only to the right port.' },
        { t: 'Protocol', d: 'A set of rules governing how data is formatted, transmitted, and received.' },
        { t: 'Packet', d: 'A small chunk of data with addressing info, routed independently across a network.' },
        { t: 'Duplex', d: 'Communication direction — simplex (one-way), half (take turns), or full (simultaneous).' },
        { t: 'CIA Triad', d: 'Confidentiality, Integrity, Availability — the three pillars of network security.' },
        { t: 'QoS', d: 'Quality of Service — prioritises critical traffic like video calls over bulk downloads.' },
    ];
    const glossList = document.getElementById('glossList');
    glossary.forEach(({ t, d }) => {
        const div = document.createElement('div'); div.className = 'gi';
        div.innerHTML = `<div class="gt">${t}<span class="gar">›</span></div><div class="gd"><p>${d}</p></div>`;
        glossList.appendChild(div);
    });

    /* BUILD PREV / NEXT */
    document.querySelectorAll('.cnav').forEach(nav => {
        const idx = +nav.dataset.idx;
        const prev = idx > 0
            ? `<a class="cnb prev" data-to="${chIds[idx - 1]}">Prev: ${chTitles[idx - 1]}</a>`
            : `<span class="cnb ghost prev">—</span>`;
        const next = idx < TOTAL - 1
            ? `<a class="cnb next" data-to="${chIds[idx + 1]}">Next: ${chTitles[idx + 1]}</a>`
            : `<a class="cnb" style="border-color:var(--success);color:var(--success);cursor:default;pointer-events:none">🎉 All done!</a>`;
        nav.innerHTML = prev + next;
        nav.querySelectorAll('[data-to]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollTo(a.dataset.to) }));
    });

    /* ACTIVE SECTION */
    function allNavAs() { return document.querySelectorAll('.ni,.bni,.oli') }
    function setActive(id) { allNavAs().forEach(a => a.classList.toggle('active', a.dataset.section === id)) }
    const secObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) });
    }, { threshold: 0.25, rootMargin: `-${NAV_H()}px 0px -40% 0px` });
    chapters.forEach(s => secObs.observe(s));

    /* SCROLL PROGRESS + FAB */
    const sBar = document.getElementById('sProgress'), fabTop = document.getElementById('fabTop');
    window.addEventListener('scroll', () => {
        const d = document.documentElement;
        const p = d.scrollTop / (d.scrollHeight - d.clientHeight) * 100;
        sBar.style.width = Math.min(p, 100) + '%';
        fabTop.classList.toggle('on', p > 12);
    }, { passive: true });

    /* BLOB PARALLAX */
    const blobs = document.querySelectorAll('.blob');
    document.addEventListener('mousemove', e => {
        const x = (e.clientX / window.innerWidth - .5) * 2, y = (e.clientY / window.innerHeight - .5) * 2;
        blobs.forEach((b, i) => { const f = (i + 1) * 7; b.style.transform = `translate(${x * f}px,${y * f}px)` });
    }, { passive: true });

    /* PROGRESS — dynamic total */
    const DK = 'nf-done3';
    let done = new Set(JSON.parse(localStorage.getItem(DK) || '[]'));
    function saveDone() { localStorage.setItem(DK, JSON.stringify([...done])) }
    function updateUI() {
        const c = done.size, p = c / TOTAL * 100;
        document.getElementById('pFill').style.width = p + '%';
        document.getElementById('pCount').textContent = c + ' / ' + TOTAL;
        chapters.forEach(ch => {
            const idx = +ch.dataset.index;
            ch.classList.toggle('dnc', done.has(idx));
            const nd = document.querySelector(`.ni[data-section="${ch.id}"] .nd`);
            if (nd) nd.classList.toggle('dn', done.has(idx));
        });
    }
    document.querySelectorAll('.db').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = +this.dataset.idx, dc = this.querySelector('.dc');
            if (done.has(idx)) { done.delete(idx); this.classList.remove('mk'); dc.textContent = '○' }
            else { done.add(idx); this.classList.add('mk'); dc.textContent = '✓' }
            saveDone(); updateUI();
        });
    });
    done.forEach(idx => {
        const b = document.querySelector(`.db[data-idx="${idx}"]`);
        if (b) { b.classList.add('mk'); b.querySelector('.dc').textContent = '✓' }
    });
    updateUI();

    /* QUIZ */
    document.querySelectorAll('.qo-wrap').forEach(wrap => {
        wrap.querySelectorAll('.qo').forEach(opt => {
            opt.addEventListener('click', () => {
                if (wrap.querySelector('.ok,.ng')) return;
                const correct = opt.dataset.c === '1';
                opt.classList.add(correct ? 'ok' : 'ng');
                const fb = wrap.closest('.qi').querySelector('.qfb');
                fb.className = 'qfb show ' + (correct ? 'qf-ok' : 'qf-ng');
                fb.textContent = correct ? '✓ Correct! Well done.' : '✗ Not quite — the right answer is highlighted.';
                if (!correct) wrap.querySelector('[data-c="1"]')?.classList.add('ok');
            });
        });
    });

    /* SEARCH */
    const sInp = document.getElementById('sInput'), sCl = document.getElementById('sClear'), noRes = document.getElementById('noRes');
    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
    function strip(el) { el.querySelectorAll('mark').forEach(m => m.replaceWith(document.createTextNode(m.textContent))) }
    function hilite(el, rx) {
        el.childNodes.forEach(n => {
            if (n.nodeType === 3) {
                const t = n.textContent; if (!rx.test(t)) return; rx.lastIndex = 0;
                const f = document.createDocumentFragment(); let l = 0, m;
                while ((m = rx.exec(t)) !== null) { f.appendChild(document.createTextNode(t.slice(l, m.index))); const mk = document.createElement('mark'); mk.textContent = m[0]; f.appendChild(mk); l = rx.lastIndex }
                f.appendChild(document.createTextNode(t.slice(l))); n.replaceWith(f);
            } else if (n.nodeType === 1 && !['SCRIPT', 'STYLE', 'MARK'].includes(n.tagName)) hilite(n, rx);
        });
    }
    function doSearch(q) {
        sCl.classList.toggle('on', q.length > 0);
        if (!q.trim()) {
            chapters.forEach(c => { c.style.display = ''; strip(c); c.classList.remove('vis') });
            setTimeout(() => chapters.forEach(c => c.classList.add('vis')), 10);
            noRes.classList.remove('show'); return;
        }
        const rx = new RegExp(esc(q), 'gi'); let any = false, first = null;
        chapters.forEach(c => {
            strip(c);
            if (rx.test(c.textContent)) { c.style.display = ''; c.classList.add('vis'); hilite(c, rx); if (!first) first = c; any = true }
            else { c.style.display = 'none'; c.classList.remove('vis') }
        });
        noRes.classList.toggle('show', !any);
        if (first) setTimeout(() => scrollTo(first.id), 80);
    }
    let st; sInp.addEventListener('input', function () { clearTimeout(st); st = setTimeout(() => doSearch(this.value), 180) });
    sCl.addEventListener('click', () => { sInp.value = ''; doSearch(''); sInp.focus() });

})();
