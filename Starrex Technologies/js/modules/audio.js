/* =========================================================
   STARREX – Ambient "liminal space" sound (Web Audio API)
   Built entirely in the browser: no audio files needed.
   A deep drone, a hollow floating pad, a faint electric hum,
   soft room air, distant chimes and a huge empty-hall reverb.
========================================================= */

(function () {
  const MASTER_LEVEL = 0.20;  // overall volume (0 – 1). Lower = quieter.

  const WHOOSH_LEVEL = 0.8;   // page-switch whoosh volume. Lower = quieter, 0 = off.

  function makeImpulse(ctx, seconds, decay) {
    const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let y = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const coef = 0.06 + 0.5 * (1 - t) * (1 - t);        // the tail gets darker and smoother
        y += ((Math.random() * 2 - 1) - y) * coef;
        d[i] = y * Math.pow(1 - t, decay);
      }
    }
    return buf;
  }

  function makePinkNoise(ctx, seconds) {
    const rate = ctx.sampleRate, len = Math.floor(rate * seconds), fade = Math.floor(rate * 0.5);
    const raw = new Float32Array(len + fade);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < raw.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    // crossfade the end into the start so the loop has no click
    const buf = ctx.createBuffer(1, len, rate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      if (i < fade) {
        const a = (i / fade) * Math.PI / 2;
        d[i] = raw[i] * Math.sin(a) + raw[len + i] * Math.cos(a);
      } else d[i] = raw[i];
    }
    return buf;
  }

  function buildEngine(ctx) {
    /* ---- output chain ---- */
    const master = ctx.createGain();
    master.gain.value = 0;
    const highpass = ctx.createBiquadFilter();            // cut the deep rumble that small speakers distort
    highpass.type = "highpass"; highpass.frequency.value = 85; highpass.Q.value = 0.7;
    const limiter = ctx.createDynamicsCompressor();       // only catches rare loud peaks
    limiter.threshold.value = -6; limiter.knee.value = 0; limiter.ratio.value = 12;
    limiter.attack.value = 0.003; limiter.release.value = 0.25;
    master.connect(highpass);
    highpass.connect(limiter);
    limiter.connect(ctx.destination);

    /* ---- big empty-hall reverb ---- */
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 5, 2.4);
    const wet = ctx.createGain(); wet.gain.value = 0.9;
    const dry = ctx.createGain(); dry.gain.value = 0.45;
    reverb.connect(wet); wet.connect(master);
    dry.connect(master);
    const bus = ctx.createGain();            // everything musical goes through here
    bus.connect(dry);
    bus.connect(reverb);

    /* ---- helpers ---- */
    function lfo(param, depth, period) {     // very slow wobble so the sound keeps evolving
      const o = ctx.createOscillator();
      o.frequency.value = 1 / period;
      const g = ctx.createGain();
      g.gain.value = depth;
      o.connect(g); g.connect(param);
      o.start();
    }
    function osc(type, freq, cents, dest, level) {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = freq; o.detune.value = cents;
      const g = ctx.createGain(); g.gain.value = level;
      o.connect(g); g.connect(dest);
      o.start();
      return g;
    }
    const noiseBuf = makePinkNoise(ctx, 4);

    /* ---- 1. deep drone ---- */
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = "lowpass"; droneFilter.frequency.value = 520; droneFilter.Q.value = 0.7;
    const droneGain = ctx.createGain(); droneGain.gain.value = 0.20;
    droneFilter.connect(droneGain); droneGain.connect(bus);
    lfo(droneFilter.frequency, 150, 23);
    lfo(osc("sine", 110, 0, droneFilter, 0.50).gain, 0.12, 17);
    lfo(osc("sine", 110, 9, droneFilter, 0.45).gain, 0.10, 21);    // slight detune = slow beating
    lfo(osc("sine", 164.81, -4, droneFilter, 0.28).gain, 0.08, 26);
    lfo(osc("triangle", 220, 3, droneFilter, 0.12).gain, 0.05, 19);

    /* ---- 2. hollow floating pad (open fifths, no "happy" or "sad" third) ---- */
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass"; padFilter.frequency.value = 1400; padFilter.Q.value = 0.4;
    const padGain = ctx.createGain(); padGain.gain.value = 1.0;
    padFilter.connect(padGain); padGain.connect(bus);
    lfo(padFilter.frequency, 500, 41);
    [[110, 13], [164.81, 17], [220, 23], [246.94, 29], [329.63, 37]].forEach(([f, period]) => {
      lfo(osc("sine", f, -5, padFilter, 0.10).gain, 0.07, period);
      osc("triangle", f, 6, padFilter, 0.04);
    });

    // a few high, glassy notes floating above the pad
    [[493.88, 31], [659.25, 43]].forEach(([f, period]) => {
      lfo(osc("sine", f, 4, padFilter, 0.035).gain, 0.03, period);
    });

    /* ---- 3. faint electric hum, like lights in an empty building ---- */
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = "lowpass"; humFilter.frequency.value = 420;
    const humGain = ctx.createGain(); humGain.gain.value = 0.010;
    humFilter.connect(humGain); humGain.connect(dry);
    lfo(humGain.gain, 0.004, 5.3);
    osc("sawtooth", 100, 0, humFilter, 1);

    /* ---- 4. soft room air ---- */
    const air = ctx.createBufferSource();
    air.buffer = noiseBuf; air.loop = true;
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = "lowpass"; airFilter.frequency.value = 800; airFilter.Q.value = 0.3;
    const airGain = ctx.createGain(); airGain.gain.value = 0.12;
    air.connect(airFilter); airFilter.connect(airGain); airGain.connect(bus);
    lfo(airFilter.frequency, 220, 33);
    air.start();

    // very faint high shimmer, like air in a huge empty room
    const shimmer = ctx.createBufferSource();
    shimmer.buffer = noiseBuf; shimmer.loop = true;
    const shimmerFilter = ctx.createBiquadFilter();
    shimmerFilter.type = "bandpass"; shimmerFilter.frequency.value = 2200; shimmerFilter.Q.value = 0.8;
    const shimmerGain = ctx.createGain(); shimmerGain.gain.value = 0.015;
    shimmer.connect(shimmerFilter); shimmerFilter.connect(shimmerGain); shimmerGain.connect(bus);
    lfo(shimmerGain.gain, 0.010, 19);
    shimmer.start(1.7);

    /* ---- 5. distant chimes ---- */
    const chimeNotes = [440, 493.88, 659.25, 739.99, 880];
    function chime(time) {
      const f = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(0.08, time + 1.8);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 9);
      g.connect(bus);
      [[f, 1], [f * 2.01, 0.25]].forEach(([freq, level]) => {
        const o = ctx.createOscillator();
        o.type = "sine"; o.frequency.value = freq;
        const og = ctx.createGain(); og.gain.value = level;
        o.connect(og); og.connect(g);
        o.start(time); o.stop(time + 9.5);
      });
    }
    let nextChime = ctx.currentTime + 6;
    function scheduleChimes(until) {
      while (nextChime < until) {
        chime(nextChime);
        nextChime += 14 + Math.random() * 16;
      }
    }

    /* ---- whoosh for page transitions ---- */
    function whoosh(time) {
      const t = time === undefined ? ctx.currentTime : time;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.Q.value = 0.5;
      f.frequency.setValueAtTime(160, t);
      f.frequency.exponentialRampToValueAtTime(1800, t + 0.9);
      f.frequency.exponentialRampToValueAtTime(240, t + 2.2);
      const soft = ctx.createBiquadFilter();               // takes the hiss off the top
      soft.type = "lowpass"; soft.frequency.value = 2200; soft.Q.value = 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(WHOOSH_LEVEL, 0.0002), t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      src.connect(f); f.connect(soft); soft.connect(g); g.connect(bus);
      src.start(t); src.stop(t + 2.6);
    }

    function fadeTo(level, seconds) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(level, t + seconds);
    }

    return { fadeTo, whoosh, scheduleChimes };
  }

  /* ---------- the on/off button ---------- */
  const btn = document.getElementById("sound-toggle");
  if (!btn) return;

  let ctx = null;
  let engine = null;
  let on = false;
  let offTimer = null;
  let chimeTimer = null;

  function setUI() {
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "Turn ambient sound off" : "Turn ambient sound on");
  }

  function stopChimeScheduler() {
    if (chimeTimer !== null) {
      window.clearTimeout(chimeTimer);
      chimeTimer = null;
    }
  }

  function scheduleChimesWhileActive() {
    if (!on || !ctx || ctx.state !== "running" || !engine) {
      chimeTimer = null;
      return;
    }

    engine.scheduleChimes(ctx.currentTime + 30);
    chimeTimer = window.setTimeout(scheduleChimesWhileActive, 5000);
  }

  async function turnOn() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;

      if (!AC) {
        btn.title = "Ambient sound is not supported by this browser.";
        return;
      }

      try {
        ctx = new AC({ latencyHint: "playback" });
        engine = buildEngine(ctx);
      } catch (error) {
        console.error("Starrex ambient sound could not be initialized:", error);
        if (ctx && ctx.state !== "closed") {
          await ctx.close().catch(() => {});
        }
        ctx = null;
        engine = null;
        return;
      }
    }

    window.clearTimeout(offTimer);
    await ctx.resume();

    if (ctx.state !== "running") return;

    on = true;
    setUI();
    engine.fadeTo(MASTER_LEVEL, 4);
    stopChimeScheduler();
    scheduleChimesWhileActive();
  }

  function turnOff() {
    if (!ctx || !engine) return;

    on = false;
    setUI();
    stopChimeScheduler();
    engine.fadeTo(0, 1.5);

    window.clearTimeout(offTimer);
    offTimer = window.setTimeout(() => {
      if (!on && ctx && ctx.state === "running") {
        ctx.suspend().catch(error => {
          console.warn("Starrex ambient sound could not be paused:", error);
        });
      }
    }, 1700);
  }

  btn.addEventListener("click", async () => {
    try {
      if (on) {
        turnOff();
      } else {
        await turnOn();
      }
    } catch (error) {
      on = false;
      stopChimeScheduler();
      setUI();
      console.warn("Starrex ambient sound could not change state:", error);
    }
  });

  /* Suspend audio and its scheduler while the tab is not visible. */
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !on) return;

    if (document.hidden) {
      stopChimeScheduler();
      ctx.suspend().catch(error => {
        console.warn("Starrex ambient sound could not be paused:", error);
      });
    } else {
      ctx.resume()
        .then(() => {
          if (on) scheduleChimesWhileActive();
        })
        .catch(error => {
          console.warn("Starrex ambient sound could not resume:", error);
        });
    }
  });

  document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
      if (on && engine) engine.whoosh();
    });
  });

  window.starrexSound = {
    whoosh: () => {
      if (on && engine) engine.whoosh();
    },
    isOn: () => on,
  };
})();
