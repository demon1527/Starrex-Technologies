/*
 * STARREX — Cinematic background soundtrack
 * Uses the locally hosted licensed music track. Playback is opt-in and
 * starts only after the visitor activates the sound control.
 */

(() => {
  "use strict";

  const MUSIC_LEVEL = 0.42;
  const FADE_IN_SECONDS = 3.8;
  const FADE_OUT_SECONDS = 1.6;

  const button = document.getElementById("sound-toggle");
  if (!button) return;

  const soundtrack = new Audio(
    new URL(
      "../../assets/audio/The Limits of the Cosmos by geoffharvey - Royalty-free Music.mp3",
      import.meta.url
    ).href
  );

  soundtrack.loop = true;
  soundtrack.preload = "none";
  soundtrack.volume = 0;

  let enabled = false;
  let fadeFrame = 0;
  let transitionContext = null;

  function updateButton() {
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute(
      "aria-label",
      enabled ? "Turn cinematic music off" : "Turn cinematic music on"
    );
    button.title = enabled
      ? "Cinematic music is on"
      : "Play cinematic music";
  }

  function fadeVolume(target, duration, onComplete) {
    window.cancelAnimationFrame(fadeFrame);

    const startVolume = soundtrack.volume;
    const startTime = performance.now();
    const durationMs = Math.max(1, duration * 1000);

    function step(now) {
      const progress = Math.min(1, (now - startTime) / durationMs);
      // Smooth ease-in/out without abrupt volume changes.
      const eased = progress * progress * (3 - 2 * progress);
      soundtrack.volume = startVolume + (target - startVolume) * eased;

      if (progress < 1) {
        fadeFrame = window.requestAnimationFrame(step);
      } else {
        soundtrack.volume = target;
        fadeFrame = 0;
        if (onComplete) onComplete();
      }
    }

    fadeFrame = window.requestAnimationFrame(step);
  }

  async function turnOn() {
    try {
      await soundtrack.play();
      enabled = true;
      updateButton();
      fadeVolume(MUSIC_LEVEL, FADE_IN_SECONDS);
    } catch (error) {
      enabled = false;
      updateButton();
      console.error("Starrex soundtrack could not be played:", error);
      button.title = "Unable to play the soundtrack. Please try again.";
    }
  }

  function turnOff() {
    enabled = false;
    updateButton();

    fadeVolume(0, FADE_OUT_SECONDS, () => {
      soundtrack.pause();
    });
  }

  function playTransition() {
    // Keep the existing navigation sound hook as a restrained one-shot swell.
    // The background score itself is the real local audio track above.
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!transitionContext || transitionContext.state === "closed") {
        transitionContext = new AudioContextClass();
      }

      if (transitionContext.state === "suspended") {
        transitionContext.resume().catch(() => {});
      }

      const ctx = transitionContext;
      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(78, now);
      oscillator.frequency.exponentialRampToValueAtTime(132, now + 0.55);
      oscillator.frequency.exponentialRampToValueAtTime(62, now + 1.45);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.42);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + 1.6);
      oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        gain.disconnect();
      }, { once: true });
    } catch (error) {
      console.warn("Starrex transition sound could not be played:", error);
    }
  }

  button.addEventListener("click", () => {
    if (enabled) turnOff();
    else turnOn();
  });

  soundtrack.addEventListener("error", () => {
    enabled = false;
    window.cancelAnimationFrame(fadeFrame);
    soundtrack.pause();
    updateButton();
    console.error(
      "Starrex soundtrack file could not be loaded. Check the local audio asset path."
    );
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(fadeFrame);
      if (enabled) {
        soundtrack.volume = 0;
        soundtrack.pause();
      }
      return;
    }

    if (enabled) {
      soundtrack.play()
        .then(() => fadeVolume(MUSIC_LEVEL, 1.2))
        .catch(error => {
          enabled = false;
          updateButton();
          console.warn("Starrex soundtrack could not resume:", error);
        });
    }
  });

  document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
      if (enabled) playTransition();
    });
  });

  window.starrexSound = {
    whoosh: () => {
      if (enabled) playTransition();
    },
    isOn: () => enabled
  };

  updateButton();
})();
