/* ─────────────────────────────────────────────
   ICLP · Interactive Chemistry Learning Platform
   iclp.js
   ───────────────────────────────────────────── */

'use strict';

/* ── PARTICLE CANVAS BACKGROUND ── */
(function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W, H, particles;

    // Particle definition
    class Particle {
        constructor() { this.reset(true); }
        reset(init = false) {
            this.x = Math.random() * W;
            this.y = init ? Math.random() * H : H + 10;
            this.r = Math.random() * 1.5 + 0.4;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = -(Math.random() * 0.4 + 0.1);
            this.alpha = Math.random() * 0.6 + 0.2;
            this.color = Math.random() > 0.6 ? '#00d4ff' : '#ffffff';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.y < -10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
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
        const count = Math.floor((W * H) / 9000);
        particles = Array.from({ length: count }, () => new Particle());
    }

    function connectParticles() {
        const maxDist = 100;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 212, 255, ${(1 - dist / maxDist) * 0.08})`;
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

    window.addEventListener('resize', () => { init(); });
    init();
    animate();
})();


/* ── SCROLL REVEAL ── */
(function initReveal() {
    const els = document.querySelectorAll(
        '.section-label, .section-title, .section-desc, .q-card, .about-text, .about-team'
    );
    els.forEach(el => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // stagger siblings
                const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
                const idx = siblings.indexOf(entry.target);
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, idx * 80);
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    els.forEach(el => io.observe(el));
})();


/* ── NAVBAR SCROLL EFFECT ── */
(function initNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            nav.style.background = 'rgba(7, 12, 24, 0.95)';
        } else {
            nav.style.background = 'rgba(7, 12, 24, 0.75)';
        }
    }, { passive: true });
})();


/* ── SMOOTH ANCHOR SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});