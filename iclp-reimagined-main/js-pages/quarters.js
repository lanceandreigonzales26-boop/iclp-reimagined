/* ═══════════════════════════════════════════════
   ICLP · quarters.js — v2
   Quarter interior pages: cursor · canvas ·
   proximity tilt · ripple · reveal
   ═══════════════════════════════════════════════ */

'use strict';

/* ── SHARED MOUSE STATE ── */
const mouse = { x: -9999, y: -9999, active: false };
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
}, { passive: true });

/* ── CUSTOM CURSOR ── */
(function initCursor() {
    const dot  = document.createElement('div'); dot.id  = 'cursor-dot';
    const ring = document.createElement('div'); ring.id = 'cursor-ring';
    document.body.append(dot, ring);
    let rx = -9999, ry = -9999;
    function lerp(a, b, t) { return a + (b - a) * t; }
    function tick() {
        rx = lerp(rx, mouse.x, 0.12);
        ry = lerp(ry, mouse.y, 0.12);
        dot.style.left  = mouse.x + 'px';
        dot.style.top   = mouse.y + 'px';
        ring.style.left = rx + 'px';
        ring.style.top  = ry + 'px';
        requestAnimationFrame(tick);
    }
    tick();
})();

/* ── PARTICLE CANVAS ── */
(function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const body = document.body;
    const q    = parseInt(body.dataset.q || '1');

    const accentMap = { 1:'0,212,255', 2:'255,201,77', 3:'167,139,250', 4:'248,113,113' };
    const rgb = accentMap[q] || accentMap[1];

    let W, H, particles;

    class Particle {
        constructor() { this.reset(true); }
        reset(init = false) {
            this.x    = Math.random() * W;
            this.y    = init ? Math.random() * H : H + 10;
            this.r    = Math.random() * 1.2 + 0.3;
            this.vx   = (Math.random() - 0.5) * 0.25;
            this.vy   = -(Math.random() * 0.35 + 0.08);
            this.alpha = Math.random() * 0.5 + 0.15;
            this.accent = Math.random() > 0.55;
        }
        update() { this.x += this.vx; this.y += this.vy; if (this.y < -10) this.reset(); }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle   = this.accent ? `rgba(${rgb},1)` : '#ffffff';
            ctx.globalAlpha = this.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    function init()   { resize(); const n = Math.floor((W*H)/10000); particles = Array.from({length:n}, ()=>new Particle()); }

    function connect() {
        const maxD = 90;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i+1; j < particles.length; j++) {
                const d = Math.hypot(particles[i].x-particles[j].x, particles[i].y-particles[j].y);
                if (d < maxD) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${rgb},${(1-d/maxD)*0.07})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0,0,W,H);
        connect();
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();
})();

/* ── PROXIMITY TILT ON TOPIC CARDS ── */
(function initProximity() {
    const cards = document.querySelectorAll('.topic-card, .formula-card, .cta-band');
    if (!cards.length) return;
    const state = Array.from(cards).map(() => ({ rx: 0, ry: 0 }));
    function lerp(a, b, t) { return a + (b - a) * t; }
    function tick() {
        cards.forEach((card, i) => {
            const rect = card.getBoundingClientRect();
            const cx   = rect.left + rect.width  / 2;
            const cy   = rect.top  + rect.height / 2;
            const dist = Math.hypot(mouse.x - cx, mouse.y - cy);
            const maxD = 250;
            const prox = dist < maxD && mouse.active ? 1 - dist / maxD : 0;
            let tRx = 0, tRy = 0;
            if (prox > 0) {
                const f = prox * 6;
                tRx = -((mouse.y - cy) / rect.height) * f * 2;
                tRy =  ((mouse.x - cx) / rect.width)  * f * 2;
            }
            state[i].rx = lerp(state[i].rx, tRx, 0.1);
            state[i].ry = lerp(state[i].ry, tRy, 0.1);
            card.style.transform = `perspective(900px) rotateX(${state[i].rx}deg) rotateY(${state[i].ry}deg)`;
        });
        requestAnimationFrame(tick);
    }
    tick();
})();

/* ── MAGNETIC BUTTONS ── */
(function initMagnetic() {
    document.querySelectorAll('.btn-game, .btn-restart, .btn-back-results').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            btn.style.transform = `translate(${(e.clientX - r.left - r.width/2) * 0.3}px, ${(e.clientY - r.top - r.height/2) * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
})();

/* ── RIPPLE ON CLICK ── */
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-game, .btn-restart, .btn-check, .btn-next, .choice-btn');
    if (!btn) return;
    const r      = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className  = 'ripple';
    ripple.style.left = (e.clientX - r.left)  + 'px';
    ripple.style.top  = (e.clientY - r.top)   + 'px';
    btn.style.position = btn.style.position || 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 620);
});

/* ── SCROLL REVEAL ── */
(function initReveal() {
    const els = document.querySelectorAll(
        '.topic-card,.formula-card,.q-section-label,.q-section-title,.q-section-desc,.cta-band'
    );
    els.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const siblings = [...(entry.target.parentElement?.querySelectorAll('.reveal') || [])];
            const idx = siblings.indexOf(entry.target);
            setTimeout(() => entry.target.classList.add('visible'), idx * 70);
            io.unobserve(entry.target);
        });
    }, { threshold: 0.1 });
    els.forEach(el => io.observe(el));
})();

/* ── NAVBAR SCROLL ── */
(function initNav() {
    const nav = document.getElementById('qnav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.style.background = window.scrollY > 40
            ? 'rgba(7,12,24,0.97)'
            : 'rgba(7,12,24,0.82)';
    }, { passive: true });
})();
