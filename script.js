(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ========================================================================
     1. Ambient Canvas: Glowing Stars & Floating Tulip Petals
     ======================================================================== */
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let stars = [];
  let petals = [];

  const PETAL_COLORS = [
    'rgba(247, 198, 217, 0.72)', // Soft blush pink
    'rgba(243, 175, 203, 0.68)', // Romantic pink
    'rgba(220, 198, 245, 0.72)', // Lavender
    'rgba(185, 154, 232, 0.55)', // Soft purple
    'rgba(255, 249, 252, 0.80)'  // White
  ];

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    const starCount = Math.min(48, Math.floor((width * height) / 24000));
    const petalCount = Math.min(22, Math.floor(width / 65) + 8);

    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.7,
      alpha: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.008
    }));

    petals = Array.from({ length: petalCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 7 + 6,
      speedY: Math.random() * 0.55 + 0.35,
      swayAmp: Math.random() * 0.8 + 0.3,
      swayFreq: Math.random() * 0.015 + 0.008,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.014,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      phase: Math.random() * Math.PI * 2
    }));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.bezierCurveTo(p.size * 0.85, -p.size * 0.4, p.size * 0.75, p.size * 0.65, 0, p.size);
    ctx.bezierCurveTo(-p.size * 0.75, p.size * 0.65, -p.size * 0.85, -p.size * 0.4, 0, -p.size);
    ctx.fill();
    ctx.restore();
  }

  function renderAmbient(animate) {
    ctx.clearRect(0, 0, width, height);

    for (const s of stars) {
      if (animate) {
        s.phase += s.speed;
      }
      const glow = s.alpha * (0.55 + 0.45 * Math.sin(s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 249, 252, ${glow.toFixed(3)})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 249, 252, 0.8)';
      ctx.fill();
    }

    ctx.shadowBlur = 0;

    for (const p of petals) {
      if (animate) {
        p.y += p.speedY;
        p.phase += p.swayFreq;
        p.x += Math.sin(p.phase) * p.swayAmp;
        p.angle += p.spin;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;
      }
      drawPetal(p);
    }

    if (animate) {
      requestAnimationFrame(() => renderAmbient(true));
    }
  }

  resizeCanvas();
  createParticles();
  renderAmbient(!prefersReducedMotion);

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
    if (prefersReducedMotion) renderAmbient(false);
  });

  /* ========================================================================
     2. Background Music Player ("About You" by The 1975)
     ======================================================================== */
  const musicPlayer = document.getElementById('music-player');
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  const muteToggle = document.getElementById('mute-toggle');
  const musicStatus = document.getElementById('music-status');

  let audioUnavailable = false;
  let fadeTimer = null;

  bgMusic.volume = 0;

  bgMusic.addEventListener('canplay', () => {
    audioUnavailable = false;
  });

  bgMusic.addEventListener('error', () => {
    if (bgMusic.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      audioUnavailable = true;
    }
  });

  function updateMusicUI() {
    const isPlaying = !bgMusic.paused && !bgMusic.ended;
    musicPlayer.classList.toggle('is-playing', isPlaying);
    musicPlayer.classList.toggle('is-muted', bgMusic.muted);
    musicToggle.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
    muteToggle.setAttribute('aria-label', bgMusic.muted ? 'Unmute music' : 'Mute music');
  }

  function fadeInVolume(target = 0.65) {
    clearInterval(fadeTimer);
    if (prefersReducedMotion) {
      bgMusic.volume = target;
      return;
    }
    fadeTimer = setInterval(() => {
      if (bgMusic.volume < target - 0.04) {
        bgMusic.volume = Math.min(target, bgMusic.volume + 0.04);
      } else {
        bgMusic.volume = target;
        clearInterval(fadeTimer);
      }
    }, 80);
  }

  async function tryPlayMusic(fromUserControl = false) {
    if (audioUnavailable) {
      if (fromUserControl) {
        musicStatus.textContent = 'Add about-you.mp3';
      }
      return;
    }

    try {
      await bgMusic.play();
      musicStatus.textContent = 'The 1975';
      fadeInVolume();
      updateMusicUI();
    } catch {
      if (fromUserControl) {
        musicStatus.textContent = 'Add about-you.mp3';
      }
      updateMusicUI();
    }
  }

  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) {
      tryPlayMusic(true);
    } else {
      bgMusic.pause();
      updateMusicUI();
    }
  });

  muteToggle.addEventListener('click', () => {
    bgMusic.muted = !bgMusic.muted;
    updateMusicUI();
  });

  /* ========================================================================
     3. Section Navigation
     ======================================================================== */
  const sections = {
    welcome: document.getElementById('welcome-section'),
    intro: document.getElementById('intro-section'),
    letter: document.getElementById('letter-section'),
    surprise: document.getElementById('surprise-section')
  };

  let currentSection = sections.welcome;
  let isTransitioning = false;

  function transitionTo(nextSection, onAfterShow) {
    if (isTransitioning || currentSection === nextSection) return;
    isTransitioning = true;

    const prevSection = currentSection;
    prevSection.classList.add('screen--leaving');
    prevSection.classList.remove('screen--active');

    const exitDuration = prefersReducedMotion ? 150 : 650;

    setTimeout(() => {
      prevSection.hidden = true;
      prevSection.classList.remove('screen--leaving');

      nextSection.hidden = false;
      window.scrollTo({ top: 0, behavior: 'instant' });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nextSection.classList.add('screen--active');
          currentSection = nextSection;
          isTransitioning = false;
          if (typeof onAfterShow === 'function') {
            onAfterShow();
          }
        });
      });
    }, exitDuration);
  }

  /* ========================================================================
     4. Love Letter Typing Experience
     ======================================================================== */
  const LETTER_PARAGRAPHS = [
    { type: 'salutation', text: 'My Dearest Boo,' },
    { type: 'normal', text: 'Happy 3rd Monthsary, my love!' },
    {
      type: 'normal',
      text: "I honestly don't know where to begin because there are so many things I want to tell you. Three months might seem like a short time, but these three months with you have given me countless reasons to smile, countless memories to treasure, and countless reasons to be thankful."
    },
    {
      type: 'normal',
      text: "Alam boo, When someone asks me about my most unforgettable moment with you, I honestly cannot choose just one. It's because every day with you becomes a moment I never want to forget. It doesn't always have to be something grand or extraordinary. Sometimes, it's just talking to you, laughing with you, hearing your voice, sharing little things, or simply knowing that you're there. Even the simplest moments become special because they're with you."
    },
    {
      type: 'normal',
      text: "I want you to know that I love everything about you. Your personality, your smile, your little habits, your happiness, your imperfections (kahit wala ka nyan), and all the little things that make you who you are. I want to appreciate you for being you."
    },
    {
      type: 'normal',
      text: "I also want to say that I'm sorry. I'm sorry for every time I've hurt you, disappointed you, made you feel misunderstood, or failed to give you the love and understanding you deserve. I know I am not perfect, and I know there will be times when I make mistakes. But please know that I never want to stop learning how to love you better. I want to grow, understand you more, listen to you, and become someone who makes you feel safe, valued, and appreciated."
    },
    {
      type: 'normal',
      text: "I cannot promise that everything will always be easy. There may be misunderstandings, difficult days, and moments when things aren't perfect. But I want you to remember this, I don't want to be someone who only stays when everything is beautiful. I want to be someone who stays even when things get difficult."
    },
    {
      type: 'promise',
      text: "No matter your choice or no matter what happens, I'll always choose you and I'll always stay."
    },
    {
      type: 'normal',
      text: "Thank you for these three beautiful months, my Boo. Thank you for being part of my everyday life. Thank you for making ordinary days feel special without even realizing it. I hope you understand how much you mean to me and how grateful I am that I get to call you mine."
    },
    {
      type: 'normal',
      text: 'And if I had to live these three months all over again, I would still find my way back to you.'
    },
    {
      type: 'normal',
      text: 'This is only our third month, and I hope we have countless more months, years, adventures, laughter, and memories ahead of us.'
    },
    { type: 'normal', text: 'Happy 3rd Monthsary, My Boo.' },
    { type: 'normal', text: 'I love you, always.' },
    { type: 'signoff', text: 'Forever choosing you,\nYour AJ ♡' }
  ];

  const letterBody = document.getElementById('letter-body');
  const letterFooter = document.getElementById('letter-footer');
  const btnSkipTyping = document.getElementById('btn-skip-typing');
  const letterTulips = Array.from(document.querySelectorAll('#letter-tulips .tulip'));

  const totalChars = LETTER_PARAGRAPHS.reduce((sum, p) => sum + p.text.length, 0);
  let typingStarted = false;
  let typingFinished = false;
  let typingTimeout = null;
  let userScrolledUp = false;

  window.addEventListener('scroll', () => {
    const distanceFromBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    userScrolledUp = distanceFromBottom > 180;
  }, { passive: true });

  function updateLetterTulips(progress) {
    const thresholds = [0.12, 0.32, 0.52, 0.74, 0.94];
    letterTulips.forEach((tulip, idx) => {
      if (progress >= thresholds[idx]) {
        tulip.classList.remove('tulip--bud');
        tulip.classList.add('tulip--bloomed', 'tulip--sway-slow');
      }
    });
  }

  function createParagraphEl(type) {
    const p = document.createElement('p');
    p.className = 'letter-paragraph';
    if (type === 'salutation') p.classList.add('letter-paragraph--salutation');
    if (type === 'promise') p.classList.add('letter-paragraph--promise');
    if (type === 'signoff') p.classList.add('letter-paragraph--signoff');
    return p;
  }

  function finishLetterImmediately() {
    clearTimeout(typingTimeout);
    typingFinished = true;
    letterBody.innerHTML = '';

    LETTER_PARAGRAPHS.forEach((item) => {
      const p = createParagraphEl(item.type);
      p.innerHTML = item.text.replace(/\n/g, '<br>');
      letterBody.appendChild(p);
    });

    updateLetterTulips(1);
    btnSkipTyping.hidden = true;
    letterFooter.hidden = false;
  }

  function startLetterTyping() {
    if (typingStarted) return;
    typingStarted = true;

    if (prefersReducedMotion) {
      finishLetterImmediately();
      return;
    }

    letterBody.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.setAttribute('aria-hidden', 'true');

    let pIndex = 0;
    let cIndex = 0;
    let typedTotal = 0;
    let currentP = createParagraphEl(LETTER_PARAGRAPHS[0].type);
    letterBody.appendChild(currentP);
    currentP.appendChild(cursor);

    function typeNextChar() {
      if (typingFinished) return;

      const currentItem = LETTER_PARAGRAPHS[pIndex];
      const text = currentItem.text;

      if (cIndex < text.length) {
        const ch = text.charAt(cIndex);
        if (ch === '\n') {
          currentP.insertBefore(document.createElement('br'), cursor);
        } else {
          currentP.insertBefore(document.createTextNode(ch), cursor);
        }

        cIndex += 1;
        typedTotal += 1;
        updateLetterTulips(typedTotal / totalChars);

        if (!userScrolledUp && typedTotal % 24 === 0) {
          cursor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        let delay = 22;
        if (ch === ',' || ch === ';') delay = 140;
        else if (ch === '.' || ch === '!' || ch === '?') delay = 260;
        else if (ch === ' ') delay = 16;

        typingTimeout = setTimeout(typeNextChar, delay);
      } else {
        pIndex += 1;
        cIndex = 0;

        if (pIndex < LETTER_PARAGRAPHS.length) {
          currentP = createParagraphEl(LETTER_PARAGRAPHS[pIndex].type);
          letterBody.appendChild(currentP);
          currentP.appendChild(cursor);
          typingTimeout = setTimeout(typeNextChar, 420);
        } else {
          typingFinished = true;
          cursor.remove();
          updateLetterTulips(1);
          btnSkipTyping.hidden = true;
          letterFooter.hidden = false;
        }
      }
    }

    typingTimeout = setTimeout(typeNextChar, 350);
  }

  /* ========================================================================
     5. Final Surprise Sequence
     ======================================================================== */
  const surpriseSteps = [
    document.getElementById('surprise-quote'),
    document.getElementById('surprise-heading'),
    document.getElementById('surprise-promise'),
    document.getElementById('surprise-actions')
  ];
  const surpriseTulips = Array.from(document.querySelectorAll('#surprise-garden .tulip'));

  function startFinalSurprise() {
    document.body.classList.add('is-bright');

    surpriseTulips.forEach((tulip, index) => {
      setTimeout(() => {
        tulip.classList.remove('tulip--bud');
        tulip.classList.add('tulip--bloomed');
      }, 250 + index * 240);
    });

    const delays = [350, 1450, 2600, 3600];
    surpriseSteps.forEach((el, index) => {
      if (!el) return;
      if (prefersReducedMotion) {
        el.classList.add('is-visible');
      } else {
        setTimeout(() => {
          el.classList.add('is-visible');
        }, delays[index]);
      }
    });
  }

  /* ========================================================================
     6. Event Listeners
     ======================================================================== */
  document.getElementById('btn-open-heart').addEventListener('click', () => {
    transitionTo(sections.intro);
  });

  document.getElementById('btn-to-letter').addEventListener('click', () => {
    tryPlayMusic(false);
    transitionTo(sections.letter, startLetterTyping);
  });

  btnSkipTyping.addEventListener('click', () => {
    finishLetterImmediately();
  });

  document.getElementById('btn-to-surprise').addEventListener('click', () => {
    transitionTo(sections.surprise, startFinalSurprise);
  });

  document.getElementById('btn-reread-letter').addEventListener('click', () => {
    document.body.classList.remove('is-bright');
    transitionTo(sections.letter);
  });
})();

