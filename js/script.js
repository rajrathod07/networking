(function () {
    'use strict';

    /* ==========================================
       0. INJECT THEME ANIMATION CSS
       ========================================== */
    const themeStyle = document.createElement('style');
    themeStyle.textContent = `
        /* View Transition API for Ripple Effect (GPU Accelerated) */
        ::view-transition-old(root),
        ::view-transition-new(root) {
            animation: none;
            mix-blend-mode: normal;
        }
        /* The NEW theme always sits on top and expands over the old theme */
        ::view-transition-old(root) { z-index: 1; }
        ::view-transition-new(root) { z-index: 9999; }

        /* CRITICAL FIX: Temporarily disable CSS color transitions while the ripple happens */
        .theme-in-motion * {
            transition: none !important;
        }

        /* Sun/Moon Icon Spin Animation */
        #themeBtn, #fabTheme {
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease !important;
            will-change: transform, opacity;
        }
        .icon-spin-out {
            transform: scale(0.3) rotate(180deg) !important;
            opacity: 0 !important;
        }
        .icon-spin-in {
            transform: scale(1) rotate(0deg) !important;
            opacity: 1 !important;
        }
    `;
    document.head.appendChild(themeStyle);

    /* ==========================================
       1. THEME MANAGEMENT & ANIMATION
       ========================================== */
    const TK = 'nf-theme2'; 
    let dark = false;
    
    function applyTheme(d) {
        dark = d; 
        document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
        const ic = d ? '☀️' : '🌙';
        
        const headerBtn = document.getElementById('themeBtn');
        const fabBtn = document.getElementById('fabTheme');
        if(headerBtn) headerBtn.textContent = ic;
        if(fabBtn) fabBtn.textContent = ic;
        
        localStorage.setItem(TK, d ? 'dark' : 'light');
    }
    
    const sv = localStorage.getItem(TK);
    applyTheme(sv ? sv === 'dark' : window.matchMedia('(prefers-color-scheme:dark)').matches);
    
    function toggleTheme(e) {
        const isDark = !dark;

        // 1. Spin and fade the icon
        const btns = [document.getElementById('themeBtn'), document.getElementById('fabTheme')].filter(Boolean);
        btns.forEach(btn => {
            btn.classList.add('icon-spin-out');
            setTimeout(() => {
                btn.classList.remove('icon-spin-out');
                btn.classList.add('icon-spin-in');
                setTimeout(() => btn.classList.remove('icon-spin-in'), 400);
            }, 150); 
        });

        // 2. Trigger the fluid background ripple effect
        setTimeout(() => {
            if (!document.startViewTransition) {
                // Instant fallback for very old browsers
                applyTheme(isDark);
                return;
            }

            // Get exact mouse click coordinates (or default to top-right if triggered via keyboard)
            const btnX = e && e.clientX ? e.clientX : window.innerWidth - 50;
            const btnY = e && e.clientY ? e.clientY : 50;

            // Logic: Light->Dark starts at button. Dark->Light starts at bottom-right corner.
            const startX = isDark ? btnX : window.innerWidth;
            const startY = isDark ? btnY : window.innerHeight;
            
            // Calculate how large the circle needs to be to cover the whole screen
            const radius = Math.hypot(
                Math.max(startX, window.innerWidth - startX), 
                Math.max(startY, window.innerHeight - startY)
            );

            // Freeze normal CSS transitions so the snapshot works instantly
            document.documentElement.classList.add('theme-in-motion');

            const transition = document.startViewTransition(() => {
                applyTheme(isDark);
            });

            transition.ready.then(() => {
                // Animate the expanding circle
                document.documentElement.animate(
                    [
                        { clipPath: `circle(0px at ${startX}px ${startY}px)` },
                        { clipPath: `circle(${radius}px at ${startX}px ${startY}px)` }
                    ],
                    {
                        duration: 700, // Smooth, liquid duration
                        easing: 'cubic-bezier(0.25, 1, 0.30, 1)', 
                        pseudoElement: '::view-transition-new(root)'
                    }
                );
            });

            // Unfreeze CSS transitions once the ripple finishes
            transition.finished.then(() => {
                document.documentElement.classList.remove('theme-in-motion');
            });

        }, 50); // Tiny delay to sync the background ripple with the button spin
    }
    
    const hBtn = document.getElementById('themeBtn');
    const fBtn = document.getElementById('fabTheme');
    if(hBtn) hBtn.addEventListener('click', toggleTheme);
    if(fBtn) fBtn.addEventListener('click', toggleTheme);
    
    window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', e => { 
        if (!localStorage.getItem(TK)) applyTheme(e.matches);
    });

    /* ==========================================
       2. PEACEFUL LOADER FADE
       ========================================== */
    window.addEventListener('load', () => {
        setTimeout(() => {
            const l = document.getElementById('ldr'); 
            if(!l) return;
            l.style.transition = 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)';
            l.classList.add('out');
            setTimeout(() => { 
                l.style.display = 'none'; 
                document.querySelectorAll('.gc').forEach((c, i) => {
                    setTimeout(() => c.classList.add('vis'), i * 120); 
                });
            }, 1200); 
        }, 1200);
    });

    /* ==========================================
       3. GLOBAL UTILS & DOM CACHING
       ========================================== */
    const chapters = Array.from(document.querySelectorAll('.chapter'));
    const TOTAL = chapters.length;
    const chIds = chapters.map(c => c.id);
    const chTitles = chapters.map(c => c.querySelector('h2').textContent);
    const NAV_H = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 62;

    // Pre-calculate heights to prevent scroll lag
    let chapterOffsets = [];
    function calcOffsets() {
        chapterOffsets = chapters.map(c => ({ id: c.id, top: c.offsetTop }));
    }
    window.addEventListener('load', calcOffsets);
    window.addEventListener('resize', calcOffsets);

    function smoothScrollTo(yPos) {
        window.scrollTo({ top: yPos, behavior: 'smooth' });
    }

    function scrollToElement(id) {
        const targetObj = chapterOffsets.find(c => c.id === id);
        if (!targetObj) return;
        const top = targetObj.top - NAV_H() - 40;
        smoothScrollTo(top);
    }

    const elegantAnim = [
        { transform: 'scale(1)' },
        { transform: 'scale(0.96)' },
        { transform: 'scale(1.02)' },
        { transform: 'scale(1)' }
    ];
    const elegantTiming = { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };

    /* ==========================================
       4. BUILD UI ELEMENTS (Sidebars)
       ========================================== */
    const navTree = document.getElementById('navTree');
    const cats = {};
    chapters.forEach(c => { 
        const cat = c.dataset.category || 'General'; 
        if (!cats[cat]) cats[cat] = []; 
        cats[cat].push(c); 
    });
    
    if(navTree) {
        Object.entries(cats).forEach(([cat, items]) => {
            const folder = document.createElement('div'); folder.className = 'nf';
            const btn = document.createElement('button'); btn.className = 'fb open';
            btn.innerHTML = `<span>${cat}</span><span class="fa">›</span>`;
            btn.onclick = () => btn.classList.toggle('open');
            
            const fi = document.createElement('div'); fi.className = 'fi';
            items.forEach(c => {
                const a = document.createElement('a'); a.className = 'ni'; a.href = '#' + c.id; a.dataset.section = c.id;
                a.innerHTML = `<span class="nd"></span>${c.querySelector('h2').textContent}`;
                a.addEventListener('click', e => { e.preventDefault(); scrollToElement(c.id); });
                fi.appendChild(a);
            });
            folder.appendChild(btn); folder.appendChild(fi); navTree.appendChild(folder);
        });
    }

    const botNav = document.getElementById('botNav');
    const bIcons = ['⬡', '⇄', '🔌', '⭐', '⟿', '↔️', '📦', '🏷️', '🎭', '✂️', '🎫', '📈', '🥞', '📶', '🌊', '☁️', '💡', '🧱', '🚇', '🏓']; 
    
    if(botNav) {
        chapters.forEach((c, i) => {
            const a = document.createElement('a'); a.className = 'bni'; a.href = '#' + c.id; a.dataset.section = c.id;
            let shortName = chTitles[i].split(' ')[0];
            if(shortName === "Public") shortName = "NAT";
            if(shortName === "The") shortName = chTitles[i].split(' ')[1] || "Net";
            
            a.innerHTML = `<span class="bic">${bIcons[i] || '·'}</span>${shortName}`;
            a.addEventListener('click', e => { e.preventDefault(); scrollToElement(c.id); });
            botNav.appendChild(a);
        });
    }

    const outlineList = document.getElementById('outlineList');
    if(outlineList) {
        chapters.forEach((c, i) => {
            const a = document.createElement('a'); a.className = 'oli'; a.href = '#' + c.id; a.dataset.section = c.id;
            const num = (i + 1).toString().padStart(2, '0');
            a.innerHTML = `<span class="oln">${num}</span>${chTitles[i]}`;
            a.addEventListener('click', e => { e.preventDefault(); scrollToElement(c.id); });
            outlineList.appendChild(a);
        });
    }

    document.querySelectorAll('.cnav').forEach(nav => {
        const idx = +nav.dataset.idx;
        const prev = idx > 0
            ? `<a class="cnb prev" data-to="${chIds[idx - 1]}">Prev: ${chTitles[idx - 1]}</a>`
            : `<span class="cnb ghost prev">—</span>`;
        const next = idx < TOTAL - 1
            ? `<a class="cnb next" data-to="${chIds[idx + 1]}">Next: ${chTitles[idx + 1]}</a>`
            : `<a class="cnb" style="border-color:var(--success);color:var(--success);cursor:default;pointer-events:none">🎉 All done!</a>`;
        nav.innerHTML = prev + next;
        nav.querySelectorAll('[data-to]').forEach(a => a.addEventListener('click', e => { 
            e.preventDefault(); 
            scrollToElement(a.dataset.to); 
        }));
    });

    /* ==========================================
       5. ORGANIC LERPING (Scroll + Blobs)
       ========================================== */
    const sBarTop = document.getElementById('sProgress'); 
    const fabTopBtn = document.getElementById('fabTop');
    let scrollTgt = 0, scrollCur = 0;

    function animateScroll() {
        const d = document.documentElement;
        const maxScroll = Math.max(1, d.scrollHeight - d.clientHeight); 
        scrollTgt = (d.scrollTop / maxScroll) * 100;
        scrollCur += (scrollTgt - scrollCur) * 0.08; 
        
        if(sBarTop) sBarTop.style.width = Math.max(0, Math.min(scrollCur, 100)) + '%';
        if(fabTopBtn) fabTopBtn.classList.toggle('on', scrollCur > 8);
        
        requestAnimationFrame(animateScroll);
    }
    animateScroll(); 

    const blobs = document.querySelectorAll('.blob');
    let mouseX = 0, mouseY = 0, blobX = 0, blobY = 0;

    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    function animateBlobs() {
        blobX += (mouseX - blobX) * 0.02;
        blobY += (mouseY - blobY) * 0.02;
        blobs.forEach((b, i) => { 
            const f = (i + 1) * 12; 
            b.style.transform = `translate(${blobX * f}px, ${blobY * f}px)`; 
        });
        requestAnimationFrame(animateBlobs);
    }
    animateBlobs(); 

    /* ==========================================
       6. CHAPTER OBSERVATION (Scroll Spy)
       ========================================== */
    function allNavAs() { return document.querySelectorAll('.ni,.bni,.oli'); }
    
    function setActive(id) { 
        allNavAs().forEach(a => {
            if(a.dataset.section) {
                a.classList.toggle('active', a.dataset.section === id);
                a.classList.toggle('cur', a.dataset.section === id); 
            }
        }); 
    }
    
    window.addEventListener('scroll', () => {
        if(chapterOffsets.length === 0) return;
        
        let currentId = chapterOffsets[0].id;
        const scrollPos = window.scrollY + NAV_H() + 150; 
        
        for (let c of chapterOffsets) {
            if (c.top <= scrollPos) {
                currentId = c.id;
            }
        }
        setActive(currentId);
    }, { passive: true });

    const secObs = new IntersectionObserver(entries => {
        entries.forEach(e => { 
            if (e.isIntersecting) {
                e.target.classList.add('vis');
                secObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });
    
    chapters.forEach(s => secObs.observe(s));

    /* ==========================================
       7. DYNAMIC CELEBRATION INJECTION (Elegant Style)
       ========================================== */
    function injectCelebration() {
        const style = document.createElement('style');
        style.textContent = `
            #nfFinish { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); opacity: 0; pointer-events: none; transition: opacity 0.5s ease; overflow: hidden; }
            #nfFinish.show { opacity: 1; pointer-events: all; }
            
            /* Rings */
            .nf-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 50%; border: 2px solid var(--accent); opacity: 0; pointer-events: none;}
            #nfFinish.show .nf-ring-1 { animation: nfRing 2.5s ease-out forwards; }
            #nfFinish.show .nf-ring-2 { animation: nfRing 3s ease-out 0.2s forwards; border-color: var(--accent2); }
            @keyframes nfRing { 0% { width: 0; height: 0; opacity: 1; border-width: 15px; } 100% { width: 150vw; height: 150vw; opacity: 0; border-width: 1px; } }
            
            /* Side Bounces */
            .nf-bounce { position: absolute; font-size: 6rem; opacity: 0; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.3)); pointer-events: none;}
            .nf-bounce-l { top: 50%; left: -150px; }
            .nf-bounce-r { top: 50%; right: -150px; }
            #nfFinish.show .nf-bounce-l { animation: nfSpringL 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.5s forwards; }
            #nfFinish.show .nf-bounce-r { animation: nfSpringR 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.7s forwards; }
            @keyframes nfSpringL { 0% { left: -150px; opacity: 0; transform: translateY(-50%) rotate(-45deg) scale(0.5); } 100% { left: 10%; opacity: 1; transform: translateY(-50%) rotate(15deg) scale(1); } }
            @keyframes nfSpringR { 0% { right: -150px; opacity: 0; transform: translateY(-50%) rotate(45deg) scale(0.5); } 100% { right: 10%; opacity: 1; transform: translateY(-50%) rotate(-15deg) scale(1); } }
            
            /* ELEGANT FORMAT CARD */
            .nf-card { 
                text-align: center; z-index: 10; transform: scale(0.8) translateY(30px); opacity: 0; 
                background: #ffffff; 
                padding: 16px; 
                border-radius: 6px; 
                box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 100px rgba(79, 99, 240, 0.15); 
                max-width: 600px; width: 92%; 
                color: #111; 
            }
            .nf-card-inner { 
                border: 2px solid #e5dfd3; 
                outline: 1px solid #e5dfd3; 
                outline-offset: -6px; 
                padding: 50px 40px; 
                background: linear-gradient(135deg, #ffffff 0%, #fcfbf9 100%); 
                border-radius: 2px;
            }
            #nfFinish.show .nf-card { animation: nfPop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.9s forwards; }
            @keyframes nfPop { to { transform: scale(1) translateY(0); opacity: 1; } }
            
            .nf-cert-seal { font-size: 3.5rem; margin-bottom: 15px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.08)); line-height: 1; }
            .nf-cert-header { font-family: 'DM Sans', sans-serif; text-transform: uppercase; letter-spacing: 0.25em; font-size: 0.75rem; color: #888; margin-bottom: 15px; font-weight: 600; }
            .nf-title { font-family: 'DM Serif Display', serif; font-size: 3rem; color: #1a1a1a; margin-bottom: 20px; line-height: 1.1; letter-spacing: -0.02em; }
            .nf-cert-line { width: 100px; height: 2px; background: #e5dfd3; margin: 0 auto 25px; }
            .nf-msg { font-size: 1.1rem; color: #4a4a4a; line-height: 1.7; margin-bottom: 35px; font-family: 'DM Sans', sans-serif; padding: 0 15px; }
            .nf-msg strong { color: #111; font-weight: 600; }
            
            .nf-btn { background: #1a1a1a; color: #fff; border: none; padding: 14px 42px; border-radius: 50px; font-size: 1.05rem; font-weight: 500; cursor: pointer; transition: all 0.3s var(--ease); font-family: 'DM Sans', sans-serif; box-shadow: 0 8px 20px rgba(0,0,0,0.15); letter-spacing: 0.02em;}
            .nf-btn:hover { transform: translateY(-3px); box-shadow: 0 12px 25px rgba(0,0,0,0.25); background: var(--accent); }
            
            /* Mobile fixes */
            @media(max-width: 900px) { 
                .nf-bounce { font-size: 4rem; }
                .nf-bounce-l { left: 5%; top: 15%; animation-name: nfSpringLMob !important; } 
                .nf-bounce-r { right: 5%; top: 85%; animation-name: nfSpringRMob !important; } 
                @keyframes nfSpringLMob { 0% { top: -100px; opacity: 0; } 100% { top: 12%; opacity: 1; transform: rotate(15deg); } } 
                @keyframes nfSpringRMob { 0% { top: 120%; opacity: 0; } 100% { top: 88%; opacity: 1; transform: rotate(-15deg); } } 
                .nf-card { padding: 12px; }
                .nf-card-inner { padding: 40px 20px; } 
                .nf-title { font-size: 2.2rem; } 
                .nf-msg { font-size: 0.95rem; padding: 0;} 
                .nf-cert-seal { font-size: 3rem; }
            }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = 'nfFinish';
        overlay.innerHTML = `
            <div class="nf-ring nf-ring-1"></div>
            <div class="nf-ring nf-ring-2"></div>
            <div class="nf-bounce nf-bounce-l">🚀</div>
            <div class="nf-bounce nf-bounce-r">🏆</div>
            <div class="nf-card">
                <div class="nf-card-inner">
                    <div class="nf-cert-seal">🎖️</div>
                    <div class="nf-cert-header">Course Concluded</div>
                    <div class="nf-title">Networking Fundamentals</div>
                    <div class="nf-cert-line"></div>
                    <div class="nf-msg">This formally acknowledges that you have successfully mastered the core concepts of computer networking, digital infrastructure, and network security.<br><br><strong>Outstanding Achievement</strong></div>
                    <button class="nf-btn" id="nfCloseBtn">Continue Journey</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('nfCloseBtn').addEventListener('click', () => overlay.classList.remove('show'));
    }
    injectCelebration();

    /* ==========================================
       8. PROGRESS TRACKING (Mark Done)
       ========================================== */
    const DK = 'nf-done7'; 
    let done = new Set(JSON.parse(localStorage.getItem(DK) || '[]'));
    
    function saveDone() { localStorage.setItem(DK, JSON.stringify([...done])); }
    
    function updateUI() {
        const c = done.size;
        const p = (c / TOTAL) * 100;
        
        const pFillEl = document.getElementById('pFill');
        if(pFillEl) pFillEl.style.width = p + '%';
        
        const pCountEl = document.getElementById('pCount');
        if(pCountEl) pCountEl.textContent = `${c} / ${TOTAL}`;
        
        chapters.forEach(ch => {
            const idx = +ch.dataset.index;
            ch.classList.toggle('dnc', done.has(idx));
            const nd = document.querySelector(`.ni[data-section="${ch.id}"] .nd`);
            if (nd) nd.classList.toggle('dn', done.has(idx));
        });

        if (c === TOTAL && !localStorage.getItem('nf-celebrated')) {
            setTimeout(() => {
                const finishModal = document.getElementById('nfFinish');
                if(finishModal) finishModal.classList.add('show');
                localStorage.setItem('nf-celebrated', 'true');
            }, 800); 
        }
    }

    document.querySelectorAll('.db').forEach(btn => {
        btn.addEventListener('click', function () {
            const idx = +this.dataset.idx;
            const dc = this.querySelector('.dc');
            
            this.animate(elegantAnim, elegantTiming);

            if (done.has(idx)) { 
                done.delete(idx); 
                this.classList.remove('mk'); 
                if(dc) dc.textContent = '○'; 
            } else { 
                done.add(idx); 
                this.classList.add('mk'); 
                if(dc) dc.textContent = '✓'; 
            }
            saveDone(); 
            updateUI();
        });
    });

    done.forEach(idx => {
        const b = document.querySelector(`.db[data-idx="${idx}"]`);
        if (b) { 
            b.classList.add('mk'); 
            const dc = b.querySelector('.dc');
            if(dc) dc.textContent = '✓'; 
        }
    });
    updateUI();

    /* ==========================================
       9. INTERACTIVE QUIZ ENGINE
       ========================================== */
    const softShakeAnim = [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(0)' }
    ];

    document.querySelectorAll('.qo-wrap').forEach(wrap => {
        wrap.querySelectorAll('.qo').forEach(opt => {
            opt.addEventListener('click', () => {
                if (wrap.querySelector('.ok,.ng')) return; 
                
                const correct = opt.dataset.c === '1';
                opt.classList.add(correct ? 'ok' : 'ng');
                opt.animate(elegantAnim, elegantTiming);

                const fb = wrap.closest('.qi').querySelector('.qfb');
                if(fb) {
                    fb.className = 'qfb show ' + (correct ? 'qf-ok' : 'qf-ng');
                    fb.innerHTML = correct 
                        ? '<strong>✓ Correct!</strong> Excellent reasoning.' 
                        : '<strong>✗ Not quite</strong> — the correct concept is now highlighted for you.';
                }
                
                if (!correct) {
                    wrap.animate(softShakeAnim, { duration: 400, easing: 'ease-in-out' });
                    const rightAnswer = wrap.querySelector('[data-c="1"]');
                    if(rightAnswer) rightAnswer.classList.add('ok'); 
                }
            });
        });
    });

    /* ==========================================
       10. ADVANCED SEARCH ENGINE
       ========================================== */
    const sInp = document.getElementById('sInput');
    const sCl = document.getElementById('sClear');
    const noResDom = document.getElementById('noRes');
    
    function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    
    function stripAndReset(el) { 
        el.querySelectorAll('mark[data-search-mark="true"]').forEach(m => {
            const parent = m.parentNode;
            while (m.firstChild) parent.insertBefore(m.firstChild, m);
            parent.removeChild(m);
        });
        
        el.normalize(); 
        el.querySelectorAll('.acb').forEach(a => { a.style.maxHeight = ''; a.style.opacity = ''; });
        el.querySelectorAll('.aci').forEach(a => { a.style.borderColor = ''; });
    }

    function hilite(el, rx, onFirstMatch) {
        el.childNodes.forEach(n => {
            if (n.nodeType === 3) {
                const t = n.textContent; 
                if (!rx.test(t)) return; 
                rx.lastIndex = 0;
                
                const f = document.createDocumentFragment(); 
                let l = 0, m;
                
                while ((m = rx.exec(t)) !== null) { 
                    f.appendChild(document.createTextNode(t.slice(l, m.index))); 
                    const mk = document.createElement('mark'); 
                    mk.textContent = m[0]; 
                    mk.setAttribute('data-search-mark', 'true'); 
                    
                    mk.style.background = 'rgba(255, 193, 7, 0.3)'; 
                    mk.style.color = 'inherit';
                    mk.style.borderRadius = '4px';
                    mk.style.padding = '0 4px';
                    mk.style.boxShadow = '0 0 6px rgba(255, 193, 7, 0.4)';
                    mk.style.borderBottom = '2px solid #ffc107';

                    f.appendChild(mk); 
                    if (onFirstMatch) onFirstMatch(mk);
                    l = rx.lastIndex; 
                }
                f.appendChild(document.createTextNode(t.slice(l))); 
                
                const aci = n.parentElement.closest('.aci');
                if (aci) {
                    const acb = aci.querySelector('.acb');
                    if (acb) {
                        acb.style.maxHeight = '1000px'; 
                        acb.style.opacity = '1';
                    }
                    aci.style.borderColor = 'var(--accent)';
                }

                n.replaceWith(f);
            } 
            else if (n.nodeType === 1 && !['SCRIPT', 'STYLE', 'MARK', 'BUTTON', 'SVG'].includes(n.tagName) && !n.closest('svg') && !n.classList.contains('qo-wrap')) {
                hilite(n, rx, onFirstMatch);
            }
        });
    }

    function doSearch(q) {
        if(!sInp || !sCl) return;
        
        sCl.classList.toggle('on', q.length > 0);
        
        chapters.forEach(c => { 
            c.style.display = ''; 
            stripAndReset(c); 
            c.classList.remove('vis'); 
        });

        if (!q.trim()) {
            setTimeout(() => chapters.forEach(c => c.classList.add('vis')), 10);
            if(noResDom) noResDom.classList.remove('show'); 
            return;
        }

        const rx = new RegExp(esc(q), 'gi'); 
        let anyMatch = false;
        let firstMatchNode = null;

        chapters.forEach(c => {
            if (rx.test(c.textContent)) { 
                c.style.display = 'block'; 
                c.classList.add('vis'); 
                
                hilite(c, rx, (node) => {
                    if (!firstMatchNode) firstMatchNode = node;
                });
                anyMatch = true; 
            } else { 
                c.style.display = 'none'; 
                c.classList.remove('vis'); 
            }
        });
        
        if(noResDom) noResDom.classList.toggle('show', !anyMatch);
        
        if (firstMatchNode) {
            setTimeout(() => {
                calcOffsets();
                const top = firstMatchNode.getBoundingClientRect().top + window.scrollY - NAV_H() - 100;
                smoothScrollTo(top);
            }, 50);
        }
    }

    let searchTimer; 
    if(sInp) {
        sInp.addEventListener('input', function () { 
            clearTimeout(searchTimer); 
            searchTimer = setTimeout(() => doSearch(this.value), 250); 
        });
    }
    
    if(sCl) {
        sCl.addEventListener('click', () => { 
            sInp.value = ''; 
            doSearch(''); 
            sInp.focus(); 
        });
    }

})();
