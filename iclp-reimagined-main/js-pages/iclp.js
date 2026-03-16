/* ═══════════════════════════════════════════════
   ICLP · iclp.js — v2
   Main page: cursor · proximity · magnetic ·
              ripple · audio visualizer · reveal
   ═══════════════════════════════════════════════ */

'use strict';

/* ── SHARED MOUSE STATE ── */
const mouse = { x: -9999, y: -9999, active: false };
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
}, { passive: true });

/* ── AUDIO STATE ── */
const audio = {
    ctx: null, analyser: null, source: null,
    freqData: null, active: false,
    getBass() {
        if (!this.active || !this.analyser) return 0;
        this.analyser.getByteFrequencyData(this.freqData);
        let sum = 0;
        const end = Math.floor(this.freqData.length * 0.15);
        for (let i = 0; i < end; i++) sum += this.freqData[i];
        return sum / end / 255;
    }
};

/* ── CUSTOM CURSOR ── */
(function initCursor() {
    const dot  = document.createElement('div'); dot.id  = 'cursor-dot';
    const ring = document.createElement('div'); ring.id = 'cursor-ring';
    document.body.append(dot, ring);

    let rx = -9999, ry = -9999; // ring lerped pos
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

/* ── CURSOR SPOTLIGHT ── */
(function initSpotlight() {
    const el = document.createElement('div');
    el.id = 'cursor-spotlight';
    document.body.appendChild(el);
    let sx = -9999, sy = -9999;
    function lerp(a, b, t) { return a + (b - a) * t; }
    function tick() {
        sx = lerp(sx, mouse.x, 0.06);
        sy = lerp(sy, mouse.y, 0.06);
        el.style.left = sx + 'px';
        el.style.top  = sy + 'px';
        requestAnimationFrame(tick);
    }
    tick();
})();

/* ── CANVAS BACKGROUND ── */
(function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles;

    class Particle {
        constructor() { this.reset(true); }
        reset(init = false) {
            this.x      = Math.random() * W;
            this.y      = init ? Math.random() * H : H + 10;
            this.r      = Math.random() * 1.5 + 0.4;
            this.baseVx = (Math.random() - 0.5) * 0.3;
            this.baseVy = -(Math.random() * 0.4 + 0.1);
            this.alpha  = Math.random() * 0.6 + 0.2;
            this.color  = Math.random() > 0.6 ? '#00d4ff' : '#ffffff';
        }
        update(bass) {
            const boost = 1 + bass * 2.5;
            this.x += this.baseVx * boost;
            this.y += this.baseVy * boost;
            if (this.y < -10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle  = this.color;
            ctx.globalAlpha = this.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    function init()   { resize(); const n = Math.floor((W*H)/9000); particles = Array.from({length:n}, () => new Particle()); }

    function connectParticles() {
        const maxD = 100;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i+1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const d  = Math.hypot(dx, dy);
                if (d < maxD) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0,212,255,${(1-d/maxD)*0.08})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function drawVisualizer() {
        if (!audio.active || !audio.analyser) return;
        audio.analyser.getByteFrequencyData(audio.freqData);
        const bars = Math.min(audio.freqData.length >> 1, 72);
        const bw   = W / bars;
        ctx.save();
        for (let i = 0; i < bars; i++) {
            const val = audio.freqData[i] / 255;
            const bh  = val * H * 0.28;
            const g   = ctx.createLinearGradient(0, H, 0, H - bh);
            g.addColorStop(0, 'rgba(0,212,255,0.55)');
            g.addColorStop(1, 'rgba(0,212,255,0)');
            ctx.fillStyle   = g;
            ctx.globalAlpha = 0.65;
            ctx.fillRect(i * bw, H - bh, bw - 1, bh);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        const bass = audio.getBass();
        connectParticles();
        particles.forEach(p => { p.update(bass); p.draw(); });
        drawVisualizer();
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();
})();

/* ── PROXIMITY TILT ON CARDS ── */
(function initProximity() {
    const cards = document.querySelectorAll('.q-card');
    if (!cards.length) return;
    const state = Array.from(cards).map(() => ({ rx: 0, ry: 0 }));

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
        cards.forEach((card, i) => {
            const rect  = card.getBoundingClientRect();
            const cx    = rect.left + rect.width  / 2;
            const cy    = rect.top  + rect.height / 2;
            const dist  = Math.hypot(mouse.x - cx, mouse.y - cy);
            const maxD  = 300;
            const prox  = dist < maxD && mouse.active ? 1 - dist / maxD : 0;

            let tRx = 0, tRy = 0;
            if (prox > 0) {
                const f = prox * 9; // max 9° tilt
                tRx = -((mouse.y - cy) / rect.height) * f * 2;
                tRy =  ((mouse.x - cx) / rect.width)  * f * 2;
            }

            state[i].rx = lerp(state[i].rx, tRx, 0.1);
            state[i].ry = lerp(state[i].ry, tRy, 0.1);

            card.style.transform = `perspective(900px) rotateX(${state[i].rx}deg) rotateY(${state[i].ry}deg)`;
            card.style.setProperty('--prox', prox.toFixed(3));

            // local mouse position inside card for radial glow
            const mx = ((mouse.x - rect.left) / rect.width  * 100).toFixed(1) + '%';
            const my = ((mouse.y - rect.top)  / rect.height * 100).toFixed(1) + '%';
            card.style.setProperty('--mx', mx);
            card.style.setProperty('--my', my);
        });
        requestAnimationFrame(tick);
    }
    tick();
})();

/* ── MAGNETIC BUTTONS ── */
(function initMagnetic() {
    document.querySelectorAll('.btn-primary, .q-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r  = btn.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width  / 2);
            const dy = e.clientY - (r.top  + r.height / 2);
            btn.style.transform = `translate(${dx * 0.28}px, ${dy * 0.28}px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
})();

/* ── RIPPLE ON CLICK ── */
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-primary, .q-btn, #audio-pick, #audio-trigger');
    if (!btn) return;
    const r      = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className    = 'ripple';
    ripple.style.left   = (e.clientX - r.left) + 'px';
    ripple.style.top    = (e.clientY - r.top)  + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 620);
});

/* ── AUDIO WIDGET ── */
(function initAudioWidget() {
    const widget = document.createElement('div');
    widget.id = 'audio-widget';
    widget.innerHTML = `
        <div id="audio-panel">
            <p id="audio-name">No track loaded</p>
            <button id="audio-pick">+ Pick file</button>
        </div>
        <button id="audio-trigger" title="Music visualizer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
            </svg>
            <canvas id="audio-mini" width="44" height="22"></canvas>
        </button>
        <input type="file" id="audio-file" accept="audio/*" style="display:none">
    `;
    document.body.appendChild(widget);

    const trigger   = widget.querySelector('#audio-trigger');
    const panel     = widget.querySelector('#audio-panel');
    const pickBtn   = widget.querySelector('#audio-pick');
    const fileInput = widget.querySelector('#audio-file');
    const nameEl    = widget.querySelector('#audio-name');
    const mini      = widget.querySelector('#audio-mini');
    const mCtx      = mini.getContext('2d');

    trigger.addEventListener('click', () => widget.classList.toggle('open'));
    pickBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        nameEl.textContent = file.name.replace(/\.[^.]+$/, '');
        loadTrack(file);
    });

    function loadTrack(file) {
        if (audio.ctx) audio.ctx.close();
        audio.ctx      = new (window.AudioContext || window.webkitAudioContext)();
        audio.analyser = audio.ctx.createAnalyser();
        audio.analyser.fftSize                = 256;
        audio.analyser.smoothingTimeConstant  = 0.82;
        audio.freqData = new Uint8Array(audio.analyser.frequencyBinCount);
        audio.analyser.connect(audio.ctx.destination);

        const reader = new FileReader();
        reader.onload = ev => {
            audio.ctx.decodeAudioData(ev.target.result, buffer => {
                if (audio.source) { try { audio.source.stop(); } catch(_) {} }
                audio.source        = audio.ctx.createBufferSource();
                audio.source.buffer = buffer;
                audio.source.connect(audio.analyser);
                audio.source.loop   = true;
                audio.source.start(0);
                audio.active        = true;
                widget.classList.add('playing');
            });
        };
        reader.readAsArrayBuffer(file);
    }

    /* mini visualizer bars on the button */
    (function drawMini() {
        mCtx.clearRect(0, 0, 44, 22);
        const bars = 8, bw = 44 / bars - 1;
        if (audio.active && audio.analyser) {
            audio.analyser.getByteFrequencyData(audio.freqData);
            for (let i = 0; i < bars; i++) {
                const idx = Math.floor(i * audio.freqData.length / bars / 2);
                const h   = (audio.freqData[idx] / 255) * 18 + 2;
                mCtx.fillStyle   = '#00d4ff';
                mCtx.globalAlpha = 0.85;
                mCtx.fillRect(i * (bw + 1), 22 - h, bw, h);
            }
        } else {
            const t = Date.now() / 550;
            for (let i = 0; i < bars; i++) {
                const h = Math.sin(t + i * 0.75) * 4 + 6;
                mCtx.fillStyle   = '#00d4ff';
                mCtx.globalAlpha = 0.28;
                mCtx.fillRect(i * (bw + 1), 22 - h, bw, h);
            }
        }
        mCtx.globalAlpha = 1;
        requestAnimationFrame(drawMini);
    })();
})();

/* ── SCROLL REVEAL ── */
(function initReveal() {
    const els = document.querySelectorAll(
        '.section-label,.section-title,.section-desc,.q-card,.about-text,.about-team'
    );
    els.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const siblings = [...(entry.target.parentElement?.querySelectorAll('.reveal') || [])];
            const idx = siblings.indexOf(entry.target);
            setTimeout(() => entry.target.classList.add('visible'), idx * 80);
            io.unobserve(entry.target);
        });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
})();

/* ── NAVBAR SCROLL ── */
(function initNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        nav.style.background = window.scrollY > 40
            ? 'rgba(7,12,24,0.97)'
            : 'rgba(7,12,24,0.75)';
    }, { passive: true });
})();

/* ── SMOOTH ANCHORS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        const t = document.querySelector(this.getAttribute('href'));
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
