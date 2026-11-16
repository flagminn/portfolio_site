/* ==========================================================================
   MOTION-FIRST JAVASCRIPT ENGINE (Lenis + GSAP + Canvas + Tilt + Modals)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* 1. TERMINAL PRELOADER & TYPEWRITER */
    const preloader = document.getElementById('preloader');
    const loaderProgress = document.getElementById('loader-progress');
    const terminalLines = document.getElementById('terminal-lines');

    const loaderSteps = [
        "init_kernel --version 6.5.0-generic...",
        "loading_modules [docker, swarm, prometheus, loki]...",
        "mounting_cmdb_database --secure...",
        "establishing_secure_vpn_tunnel...",
        "status: ALL SYSTEMS OPERATIONAL [READY]"
    ];

    let currentStep = 0;
    const intervalTime = 180;

    const progressInterval = setInterval(() => {
        currentStep++;
        const percent = Math.min(currentStep * 20, 100);
        if (loaderProgress) loaderProgress.style.width = `${percent}%`;

        if (currentStep - 1 < loaderSteps.length && terminalLines) {
            const p = document.createElement('p');
            p.className = 't-line';
            p.textContent = `> ${loaderSteps[currentStep - 1]}`;
            terminalLines.appendChild(p);
        }

        if (currentStep >= 5) {
            clearInterval(progressInterval);
            setTimeout(() => {
                if (preloader) preloader.classList.add('fade-out');
                initHeroAnimations();
            }, 400);
        }
    }, intervalTime);

    /* 2. LENIS SMOOTH SCROLL & GSAP SCROLLTRIGGER */
    let lenis;
    try {
        lenis = new Lenis({
            lerp: 0.1,
            wheelMultiplier: 1.0,
            smoothWheel: true,
        });

        lenis.on('scroll', ScrollTrigger.update);

        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    } catch (e) {
        console.log('Lenis init warning:', e);
    }

    /* 3. HERO TYPEWRITER PHRASES */
    const typewriterEl = document.getElementById('typewriter-text');
    const phrases = [
        "deploying_resilient_infrastructure...",
        "analyzing_system_logs_at_3am...",
        "docker_swarm_cluster_online...",
        "prometheus_alerts_configured...",
        "uptime_99.99_percent_stable...",
        "legal_mindset_meets_devops_precision..."
    ];

    if (typewriterEl) {
        gsap.to(typewriterEl, {
            text: {
                value: phrases[0],
                delimiter: ""
            },
            duration: 2,
            delay: 1.5,
            onComplete: () => {
                // Loop through phrases using GSAP TextPlugin
                let tl = gsap.timeline({ repeat: -1 });
                phrases.forEach((phrase, index) => {
                    if (index === 0) return; // already typed
                    tl.to(typewriterEl, {
                        text: phrase,
                        duration: 2,
                        delay: 1.5,
                        ease: "none"
                    }).to(typewriterEl, {
                        text: "",
                        duration: 1,
                        delay: 1.5,
                        ease: "none"
                    });
                });
            }
        });
    }

    /* 4. CANVAS BACKGROUND (Interactive Neural/Network Nodes) */
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const mouse = { x: null, y: null, radius: 150 };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            mouse.x = null;
            mouse.y = null;
        });

        const particlesCount = Math.min(width > 768 ? 60 : 30, 80);
        const particles = [];

        for (let i = 0; i < particlesCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 2 + 1
            });
        }

        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';

            particles.forEach((p, index) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();

                // Connect particles
                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.lineWidth = 1 - (dist / 120);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                // Mouse interaction
                if (mouse.x !== null && mouse.y !== null) {
                    const mdx = p.x - mouse.x;
                    const mdy = p.y - mouse.y;
                    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

                    if (mdist < mouse.radius) {
                        ctx.strokeStyle = `rgba(16, 185, 129, ${1 - mdist / mouse.radius})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            });

            requestAnimationFrame(animateCanvas);
        }
        animateCanvas();
    }

    /* 5. HERO ENTRANCE ANIMATIONS */
    function initHeroAnimations() {
        gsap.from('.hero-badge, .hero-title, .hero-subtitle, .terminal-box, .hero-actions', {
            y: 40,
            opacity: 0,
            duration: 1,
            stagger: 0.15,
            ease: 'power3.out'
        });

        gsap.from('.avatar-card', {
            scale: 0.9,
            opacity: 0,
            duration: 1.2,
            delay: 0.3,
            ease: 'power3.out'
        });
    }

    /* 6. SCROLLTRIGGER MORPH & CLIP-PATH ANIMATIONS */
    gsap.utils.toArray('.morph-container').forEach((container) => {
        gsap.fromTo(container, 
            {
                clipPath: 'inset(8% round 24px)',
                scale: 0.96,
                opacity: 0.5
            },
            {
                clipPath: 'inset(0% round 0px)',
                scale: 1,
                opacity: 1,
                duration: 1,
                scrollTrigger: {
                    trigger: container,
                    start: 'top 85%',
                    end: 'top 40%',
                    scrub: 1
                }
            }
        );
    });

    /* 7. VANILLA TILT INITIALIZATION */
    if (window.VanillaTilt) {
        VanillaTilt.init(document.querySelectorAll(".tilt-card"), {
            max: 5,
            speed: 400,
            glare: true,
            "max-glare": 0.15,
            scale: 1.02
        });
    }

    /* 8. MOBILE MENU TOGGLE */
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobLinks = document.querySelectorAll('.mob-link, .nav-link');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        mobLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    /* 9. MODAL WINDOWS & TABS */
    const modalBackdrop = document.getElementById('modalBackdrop');
    const openModalBtns = document.querySelectorAll('.open-modal');
    const closeModalBtns = document.querySelectorAll('[data-close], .modal-backdrop');
    const projectModals = document.querySelectorAll('.project-modal');

    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = btn.getAttribute('data-target');
            const targetModal = document.getElementById(targetId);

            if (modalBackdrop && targetModal) {
                modalBackdrop.classList.add('active');
                projectModals.forEach(m => m.classList.remove('active'));
                targetModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    function closeModal() {
        if (modalBackdrop) {
            modalBackdrop.classList.remove('active');
            projectModals.forEach(m => m.classList.remove('active'));
            document.body.style.overflow = '';
        }
    }

    closeModalBtns.forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === modalBackdrop || el.hasAttribute('data-close')) {
                closeModal();
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Modal Tabs logic
    projectModals.forEach(modal => {
        const tabs = modal.querySelectorAll('.tab-btn');
        const contents = modal.querySelectorAll('.modal-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');

                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                const targetContent = modal.querySelector(`[data-tab-content="${tabName}"]`);
                if (targetContent) targetContent.classList.add('active');
            });
        });
    });

    /* 10. MAGNETIC BUTTON EFFECT */
    const magneticButtons = document.querySelectorAll('.btn-magnetic');

    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'elastic.out(1, 0.4)'
            });
        });
    });

});
