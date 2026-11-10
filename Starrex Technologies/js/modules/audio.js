/*
 * STARREX — Persistent cinematic background soundtrack
 * The site uses separate HTML documents. Playback therefore has to be
 * handed off through sessionStorage when a visitor moves between pages.
 * The next page resumes at the saved track position instead of restarting.
 */

(() => {
  "use strict";

  const MUSIC_LEVEL = 0.42;
  const FADE_IN_SECONDS = 3.8;
  const FADE_OUT_SECONDS = 1.6;
  const PLAYBACK_STATE_KEY = "starrex:music-playback:v1";
  const PLAYBACK_STATE_MAX_AGE = 30 * 60 * 1000;

  const button = document.getElementById("sound-toggle");
  if (!button) return;

  const soundtrack = new Audio(
    new URL(
      "../../assets/audio/The Limits of the Cosmos by geoffharvey - Royalty-free Music.mp3",
      import.meta.url
    ).href
  );

  let savedPlayback = null;

  try {
    const rawState = window.sessionStorage.getItem(PLAYBACK_STATE_KEY);
    if (rawState) {
      const state = JSON.parse(rawState);
      const isRecent = Number.isFinite(state.savedAt) &&
        Date.now() - state.savedAt >= 0 &&
        Date.now() - state.savedAt <= PLAYBACK_STATE_MAX_AGE;
      const hasValidTime = Number.isFinite(state.currentTime) &&
        state.currentTime >= 0;

      if (state.enabled === true && isRecent && hasValidTime) {
        savedPlayback = { currentTime: state.currentTime };
      } else {
        window.sessionStorage.removeItem(PLAYBACK_STATE_KEY);
      }
    }
  } catch {
    try {
      window.sessionStorage.removeItem(PLAYBACK_STATE_KEY);
    } catch {
      // Storage may be unavailable; normal page-local playback still works.
    }
  }

  soundtrack.loop = true;
  soundtrack.preload = savedPlayback ? "auto" : "none";
  soundtrack.volume = 0;

  let enabled = false;
  let fadeFrame = 0;
  let transitionContext = null;
  let pendingResumeTime = savedPlayback?.currentTime ?? null;

  function updateButton() {
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute(
      "aria-label",
      enabled ? "Turn cinematic music off" : "Turn cinematic music on"
    );
    button.title = enabled
      ? "Cinematic music is on"
      : pendingResumeTime !== null
        ? "Resume cinematic music"
        : "Play cinematic music";
  }

  function fadeVolume(target, duration, onComplete) {
    window.cancelAnimationFrame(fadeFrame);

    const startVolume = soundtrack.volume;
    const startTime = performance.now();
    const durationMs = Math.max(1, duration * 1000);

    function step(now) {
      const progress = Math.min(1, (now - startTime) / durationMs);
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

  function waitForMetadata() {
    if (soundtrack.readyState >= HTMLMediaElement.HAVE_METADATA) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        soundtrack.removeEventListener("loadedmetadata", handleLoaded);
        soundtrack.removeEventListener("error", handleError);
      };
      const handleLoaded = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error("The Starrex soundtrack metadata could not be loaded."));
      };

      soundtrack.addEventListener("loadedmetadata", handleLoaded, { once: true });
      soundtrack.addEventListener("error", handleError, { once: true });
      soundtrack.load();
    });
  }

  async function startPlayback(resumeAt = null) {
    const isRestoringPlayback = resumeAt !== null;
    try {
      if (resumeAt !== null) {
        await waitForMetadata();
        const duration = soundtrack.duration;
        const safeTime = Number.isFinite(duration) && duration > 0
          ? resumeAt % duration
          : resumeAt;
        soundtrack.currentTime = safeTime;
      }

      await soundtrack.play();
      pendingResumeTime = null;
      enabled = true;
      updateButton();
      fadeVolume(MUSIC_LEVEL, isRestoringPlayback ? 1.1 : FADE_IN_SECONDS);
    } catch (error) {
      enabled = false;
      updateButton();
      console.warn("Starrex soundtrack could not be started:", error);
      button.title = pendingResumeTime !== null
        ? "Click to resume the soundtrack from where it stopped"
        : "Unable to play the soundtrack. Please try again.";
    }
  }

  function turnOn() {
    startPlayback(pendingResumeTime);
  }

  function turnOff() {
    enabled = false;
    pendingResumeTime = null;
    window.cancelAnimationFrame(fadeFrame);
    soundtrack.volume = 0;
    soundtrack.pause();
    updateButton();

    try {
      window.sessionStorage.removeItem(PLAYBACK_STATE_KEY);
    } catch {
      // Playback can still be turned off when storage is unavailable.
    }
  }

  function savePlaybackForNextPage() {
    if (!enabled) return;

    try {
      window.sessionStorage.setItem(
        PLAYBACK_STATE_KEY,
        JSON.stringify({
          enabled: true,
          currentTime: soundtrack.currentTime,
          savedAt: Date.now(),
        })
      );
    } catch {
      // Keep navigation working if session storage is unavailable.
    }
  }

  function playTransition() {
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

  window.addEventListener("pagehide", savePlaybackForNextPage);

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

  // Resume automatically on the next HTML page. If the browser blocks
  // autoplay, the sound button remains available to resume at this position.
  if (pendingResumeTime !== null) {
    startPlayback(pendingResumeTime);
  }
})();
