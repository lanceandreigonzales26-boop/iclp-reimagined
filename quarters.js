/* ─────────────────────────────────────────────
   ICLP · Quarter Interior Pages
   quarters.js
   ───────────────────────────────────────────── */

'use strict';

/* ── PARTICLE CANVAS ── */
(function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const body = document.body;
    const q = parseInt(body.dataset.q || '1');

    const accentMap = {
        1: '0,212,255',
        2: '255,201,77',
        3: '167,139,250',
        4: '248,113,113'
    };
    const accentRGB = accentMap[q] || accentMap[1];

    let W, H, particles;

    class Particle {
        constructor() { this.reset(true); }
        reset(init = false) {
            this.x = Math.random() * W;
            this.y = init ? Math.random() * H : H + 10;
            this.r = Math.random() * 1.2 + 0.3;
            this.vx = (Math.random() - 0.5) * 0.25;
            this.vy = -(Math.random() * 0.35 + 0.08);
            this.alpha = Math.random() * 0.5 + 0.15;
            this.isAccent = Math.random() > 0.55;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y < -10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = this.isAccent ? `rgba(${accentRGB},1)` : '#ffffff';
            ctx.globalAlpha = this.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function init() {
        resize();
        const count = Math.floor((W * H) / 10000);
        particles = Array.from({ length: count }, () => new Particle());
    }

    function connectParticles() {
        const maxDist = 90;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${accentRGB},${(1 - dist / maxDist) * 0.07})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        connectParticles();
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', init);
    init();
    animate();
})();

/* ── SCROLL REVEAL ── */
(function initReveal() {
    const els = document.querySelectorAll(
        '.topic-card, .formula-card, .q-section-label, .q-section-title, .q-section-desc, .cta-band'
    );
    els.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const siblings = [...(entry.target.parentElement?.querySelectorAll('.reveal') || [])];
                const idx = siblings.indexOf(entry.target);
                setTimeout(() => entry.target.classList.add('visible'), idx * 70);
                io.unobserve(entry.target);
            }
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
