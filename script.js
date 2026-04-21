document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       VARIABLES
    ========================================== */
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const appContainer = document.getElementById('app-container');
    const startOverlay = document.getElementById('start-overlay');
    let isMusicPlaying = false;
    let currentSection = 0; // 0 = overlay

    /* ==========================================
       SECTIONS NAVIGATION LOGIC
    ========================================== */
    function goToSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('section').forEach(sec => {
            sec.classList.remove('active-section');
        });
        // Show target section
        const target = document.getElementById(sectionId);
        if(target) {
            target.classList.add('active-section');
        }
    }

    /* ==========================================
       AUDIO CONTROLS
    ========================================== */
    function playMusic() {
        // Attempt to play music with a soft fade-in
        bgMusic.volume = 0;
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            musicToggle.textContent = '🔊';
            musicToggle.classList.remove('hidden');
            musicToggle.classList.add('music-pulse');
            
            // Fade in volume to 1.0 over 3 seconds
            let vol = 0;
            const fadeInterval = setInterval(() => {
                vol += 0.05;
                if(vol >= 1) {
                    bgMusic.volume = 1;
                    clearInterval(fadeInterval);
                } else {
                    bgMusic.volume = vol;
                }
            }, 100);

        }).catch(err => {
            console.log("Audio play failed: ", err);
        });
    }

    musicToggle.addEventListener('click', () => {
        if (isMusicPlaying) {
            bgMusic.pause();
            musicToggle.textContent = '🔇';
            isMusicPlaying = false;
        } else {
            bgMusic.play();
            musicToggle.textContent = '🔊';
            isMusicPlaying = true;
        }
    });

    /* ==========================================
       START OVERLAY & COUNTDOWN (SEC 1 & 2)
    ========================================== */
    document.getElementById('btn-start-overlay').addEventListener('click', () => {
        // Hide Overlay
        startOverlay.style.opacity = '0';
        setTimeout(() => {
            startOverlay.style.display = 'none';
            appContainer.classList.remove('hidden');
            playMusic();
            startCountdown();
        }, 1000);
    });

    function startCountdown() {
        const countdownEl = document.getElementById('countdown');
        const circle = document.querySelector('.progress-ring__circle');
        const circumference = 2 * Math.PI * 72; // ~452.39
        
        let count = 10;
        
        // Initial state is full circle
        if (circle) circle.style.strokeDashoffset = 0;
        
        const timer = setInterval(() => {
            count--;
            if(count > 0) {
                countdownEl.textContent = count;
                
                // Animate circle ring draining out
                if (circle) {
                    const offset = circumference - (count / 10) * circumference;
                    circle.style.strokeDashoffset = offset;
                }
                
                countdownEl.style.animation = 'none';
                void countdownEl.offsetWidth; // trigger reflow
                countdownEl.style.animation = 'pulse 1s infinite alternate';
            } else {
                clearInterval(timer);
                if (circle) circle.style.strokeDashoffset = circumference;
                
                // Slight pause after countdown ends before switching exactly when it vanishes
                setTimeout(() => {
                    goToSection('sec2');
                    startLoader();
                }, 500);
            }
        }, 1000);
    }

    function startLoader() {
        // Wait 5 seconds then go to Intro (sec3)
        setTimeout(() => {
            goToSection('sec3');
        }, 5000);
    }

    /* ==========================================
       INTRO MESSAGE (SEC 3) -> CAKE (SEC 4)
    ========================================== */
    document.getElementById('btn-start-surprise').addEventListener('click', () => {
        goToSection('sec4');
    });

    /* ==========================================
       INTERACTIVE CAKE LOGIC (SEC 4)
    ========================================== */
    const btnDecorate = document.getElementById('btn-decorate');
    const btnBalloons = document.getElementById('btn-balloons');
    const btnCandles = document.getElementById('btn-candles');
    const cutInstruction = document.getElementById('cut-instruction');

    btnDecorate.addEventListener('click', () => {
        const banner = document.getElementById('cake-banner');
        if (banner) banner.classList.add('show-banner');
        
        // Fire confetti from the top when banner drops
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.1 },
                colors: ['#ffb6c1', '#ffc0cb', '#ff69b4', '#fff']
            });
        }

        btnDecorate.classList.add('hidden');
        btnBalloons.classList.remove('hidden');
    });

    btnBalloons.addEventListener('click', () => {
        spawnBalloons();
        btnBalloons.classList.add('hidden');
        btnCandles.classList.remove('hidden');
    });

    btnCandles.addEventListener('click', () => {
        // Light flames
        document.querySelectorAll('.flame').forEach(flame => flame.classList.remove('hidden'));
        btnCandles.classList.add('hidden');
        cutInstruction.classList.remove('hidden');
        enableCakeCutting();
    });

    function spawnBalloons() {
        const container = document.getElementById('balloons-container');
        for (let i = 0; i < 15; i++) {
            let balloon = document.createElement('div');
            balloon.classList.add('balloon');
            // Random styling
            balloon.style.left = Math.random() * 90 + '%';
            balloon.style.animationDuration = (Math.random() * 4 + 6) + 's';
            balloon.style.animationDelay = Math.random() * 2 + 's';
            // Random color shifts
            const hue = Math.floor(Math.random() * 40 - 20); // slightly modify pink
            balloon.style.filter = `hue-rotate(${hue}deg) brightness(${Math.random() * 0.2 + 0.9})`;
            container.appendChild(balloon);
        }
    }

    /* ==========================================
       CAKE CUTTING GESTURE (SWIPE)
    ========================================== */
    let canCutCake = false;
    let isDrawing = false;
    let startX = 0, startY = 0;
    const swipeTrace = document.getElementById('swipe-trace');

    function enableCakeCutting() {
        canCutCake = true;
    }

    // Touch / Mouse events mapping
    const container = document.getElementById('sec4');

    container.addEventListener('mousedown', pointerDown);
    container.addEventListener('touchstart', pointerDown, {passive: true});

    container.addEventListener('mousemove', pointerMove);
    container.addEventListener('touchmove', pointerMove, {passive: true});

    container.addEventListener('mouseup', pointerUp);
    container.addEventListener('touchend', pointerUp);

    function pointerDown(e) {
        if(!canCutCake) return;
        isDrawing = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        
        swipeTrace.style.display = 'block';
        swipeTrace.style.left = startX + 'px';
        swipeTrace.style.top = startY + 'px';
        swipeTrace.style.width = '0px';
    }

    function pointerMove(e) {
        if(!isDrawing) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        swipeTrace.style.width = distance + 'px';
        swipeTrace.style.transform = `rotate(${angle}deg)`;
    }

    function pointerUp(e) {
        if(!isDrawing) return;
        isDrawing = false;
        setTimeout(() => { swipeTrace.style.display = 'none'; }, 300);

        // Any click or small swipe will now correctly cut the cake
        // This is much more foolproof for both mobile and desktop users
        triggerCakeCut();
    }

    function triggerCakeCut() {
        canCutCake = false; // block multiple cuts
        cutInstruction.classList.add('hidden');
        
        document.getElementById('cake').classList.add('cut');
        
        // Fire Confetti celebration
        fireConfetti();

        // Wait a few seconds to let them enjoy, then move to title page
        setTimeout(() => {
            goToSection('sec5');
            // Disable confetti and balloons as we move to next section
        }, 5000);
    }

    function fireConfetti() {
        var duration = 3 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        var interval = setInterval(function() {
            var timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            var particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, { particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
        }, 250);
    }

    /* ==========================================
       SECTION 5: TITLE PAGE -> SEC 6
    ========================================== */
    document.getElementById('btn-next-title').addEventListener('click', () => {
        goToSection('sec6');
        initCarousel();
    });

    /* ==========================================
       CAROUSEL LOGIC (SEC 6)
    ========================================== */
    const track = document.getElementById('carousel-track');
    const cards = Array.from(track.children);
    let currentIndex = 0;

    function initCarousel() {
        updateCarousel();
    }

    function updateCarousel() {
        const total = cards.length;
        
        cards.forEach((card, index) => {
            card.style.transition = 'all 0.5s ease-in-out';
            
            if(index === currentIndex) {
                // Center
                card.style.transform = 'translate(-50%, -50%) scale(1) translateZ(0)';
                card.style.opacity = 1;
                card.style.zIndex = 10;
                card.style.pointerEvents = 'auto';
            } else if (index === (currentIndex + 1) % total) {
                // Right
                card.style.transform = 'translate(-20%, -50%) scale(0.8) translateZ(-50px) rotateY(-15deg)';
                card.style.opacity = 0.6;
                card.style.zIndex = 5;
                card.style.pointerEvents = 'none';
            } else if (index === (currentIndex - 1 + total) % total) {
                // Left
                card.style.transform = 'translate(-80%, -50%) scale(0.8) translateZ(-50px) rotateY(15deg)';
                card.style.opacity = 0.6;
                card.style.zIndex = 5;
                card.style.pointerEvents = 'none';
            } else {
                // Hidden behind
                card.style.transform = 'translate(-50%, -50%) scale(0.6) translateZ(-100px)';
                card.style.opacity = 0;
                card.style.zIndex = 1;
                card.style.pointerEvents = 'none';
            }

            // A tiny trick: For CSS translate(-50%, -50%) to work as centered anchors, 
            // the cards need top:50%, left:50%. Let's set that via JS since we missed it in CSS,
            // or just use normal coordinates
            card.style.top = '50%';
            card.style.left = '50%';
        });
    }

    document.getElementById('carousel-next').addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % cards.length;
        updateCarousel();
    });

    document.getElementById('carousel-prev').addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        updateCarousel();
    });

    /* ==========================================
       GOTO FINAL MESSAGE (SEC 7)
    ========================================== */
    document.getElementById('btn-open-msg').addEventListener('click', () => {
        goToSection('sec7');
    });

    /* ==========================================
       FINAL REVEAL (SEC 8) — Cinematic Transition
    ========================================== */
    document.getElementById('btn-to-reveal').addEventListener('click', () => {
        const sec7 = document.getElementById('sec7');

        // Fade out sec7 with smooth opacity
        sec7.style.transition = 'opacity 0.8s ease';
        sec7.style.opacity = '0';

        setTimeout(() => {
            // Switch section
            goToSection('sec8');

            // Apply cinematic zoom-in effect to new section
            const sec8 = document.getElementById('sec8');
            sec8.style.transition = 'none';
            sec8.style.opacity = '0';
            sec8.style.transform = 'scale(0.95)';

            // Force reflow then animate in
            void sec8.offsetWidth;
            sec8.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            sec8.style.opacity = '1';
            sec8.style.transform = 'scale(1)';

            // Reset sec7 opacity for if user goes back
            setTimeout(() => { sec7.style.opacity = '1'; }, 100);

            // Trigger floating hearts burst when final line appears (~8s delay)
            setTimeout(() => {
                spawnRevealHearts();
            }, 9000);

        }, 800);
    });

    // Spawn gentle floating hearts for the final line moment
    function spawnRevealHearts() {
        const sec8 = document.getElementById('sec8');
        const heartEmojis = ['💖', '💕', '✨', '💫', '🌸'];
        for (let i = 0; i < 8; i++) {
            const heart = document.createElement('div');
            heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
            heart.style.cssText = `
                position: absolute;
                left: ${Math.random() * 90 + 5}%;
                bottom: 0;
                font-size: ${Math.random() * 1 + 1}rem;
                opacity: 0;
                pointer-events: none;
                z-index: 50;
                animation: floatUp ${Math.random() * 3 + 4}s ease-in forwards;
                animation-delay: ${Math.random() * 2}s;
            `;
            sec8.appendChild(heart);
            setTimeout(() => heart.remove(), 8000);
        }
    }

    /* ==========================================
       FINAL CALM BUTTON → BIRTHDAY ENDING
    ========================================== */
    document.getElementById('btn-final-calm').addEventListener('click', () => {
        const revealCard = document.getElementById('reveal-card');
        const ending = document.getElementById('birthday-ending');

        // Slight volume dip for calm ending
        if (bgMusic && !bgMusic.paused) {
            const currentVol = bgMusic.volume;
            let vol = currentVol;
            const dip = setInterval(() => {
                vol = Math.max(0.3, vol - 0.05);
                bgMusic.volume = vol;
                if (vol <= 0.3) clearInterval(dip);
            }, 100);
        }

        // Fade out the confession card with slight zoom-out
        revealCard.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        revealCard.style.opacity = '0';
        revealCard.style.transform = 'scale(0.95)';

        setTimeout(() => {
            revealCard.style.display = 'none';

            // Show and fade in birthday ending
            ending.style.display = 'block';
            void ending.offsetWidth; // reflow
            ending.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            ending.style.transform = 'scale(0.95)';
            ending.style.opacity = '0';

            void ending.offsetWidth;
            ending.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            ending.style.opacity = '1';
            ending.style.transform = 'scale(1)';

            // Spawn a few celebratory hearts for warm end
            spawnRevealHearts();
        }, 650);
    });

});
