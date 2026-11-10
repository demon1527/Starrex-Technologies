/*
 * STARREX — Cinematic space score
 * Procedurally composed with the Web Audio API. No external audio files,
 * network requests, or autoplay: playback begins only after the sound
 * control is activated by the visitor.
 */

(() => {
  "use strict";

  const MASTER_LEVEL = 0.14;
  const TRANSITION_LEVEL = 0.055;
  const BPM = 72;
  const BEAT = 60 / BPM;

  const CHORDS = [
    { bass: 73.42, notes: [146.83, 174.61, 220.00, 329.63] }, // Dm(add9)
    { bass: 58.27, notes: [116.54, 146.83, 174.61, 220.00] },      // Bbmaj7
    { bass: 87.31, notes: [174.61, 220.00, 261.63, 392.00] },      // F(add9)
    { bass: 65.41, notes: [130.81, 164.81, 196.00, 293.66] }       // C(add9)
  ];

  const MELODY = [
    [587.33, 0.72], [523.25, 0.48], [440.00, 0.72], [392.00, 0.48],
    [523.25, 0.72], [440.00, 0.48], [349.23, 0.72], [392.00, 0.48],
    [587.33, 0.72], [659.25, 0.48], [523.25, 0.72], [440.00, 0.48],
    [493.88, 0.72], [440.00, 0.48], [392.00, 0.72], [349.23, 0.48]
  ];

  function makeReverb(ctx, seconds = 4.8) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const fade = Math.pow(1 - i / length, 2.8);
        data[i] = (Math.random() * 2 - 1) * fade * 0.22;
      }
    }

    return impulse;
  }

  function buildEngine(ctx) {
    const master = ctx.createGain();
    master.gain.value = 0;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.035;
    compressor.release.value = 0.35;

    const highPass = ctx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 38;

    master.connect(highPass);
    highPass.connect(compressor);
    compressor.connect(ctx.destination);

    const dryBus = ctx.createGain();
    dryBus.gain.value = 0.72;

    const reverb = ctx.createConvolver();
    reverb.buffer = makeReverb(ctx);
    const wetBus = ctx.createGain();
    wetBus.gain.value = 0.30;

    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.78;

    musicBus.connect(dryBus);
    musicBus.connect(reverb);
    dryBus.connect(master);
    reverb.connect(wetBus);
    wetBus.connect(master);

    function createVoice(type, frequency, gainValue, destination, detune = 0) {
      const oscillator = ctx.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune;

      const gain = ctx.createGain();
      gain.gain.value = gainValue;
      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start();

      return { oscillator, gain };
    }

    // A soft, low foundation — felt more than heard.
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowpass";
    bassFilter.frequency.value = 190;
    bassFilter.connect(musicBus);
    const bass = createVoice("sine", CHORDS[0].bass, 0.16, bassFilter);

    // Four sustained chord tones form the main cinematic pad.
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 1250;
    padFilter.Q.value = 0.45;
    padFilter.connect(musicBus);

    const padVoices = CHORDS[0].notes.map((frequency, index) =>
      createVoice(index === 0 ? "triangle" : "sine", frequency, index === 0 ? 0.075 : 0.052, padFilter, index % 2 ? 3 : -3)
    );

    // A very quiet octave layer adds width without a harsh synthetic edge.
    const upperVoices = [
      createVoice("sine", 293.66, 0.018, padFilter, -4),
      createVoice("sine", 440.00, 0.014, padFilter, 4)
    ];

    // Slow filter movement keeps the sustained harmony alive.
    const filterLfo = ctx.createOscillator();
    const filterDepth = ctx.createGain();
    filterLfo.frequency.value = 0.035;
    filterDepth.gain.value = 260;
    filterLfo.connect(filterDepth);
    filterDepth.connect(padFilter.frequency);
    filterLfo.start();

    // Gentle stereo movement, kept deliberately subtle.
    const pan = ctx.createStereoPanner();
    pan.pan.value = 0;
    musicBus.disconnect();
    musicBus.connect(pan);
    pan.connect(dryBus);
    pan.connect(reverb);
    const panLfo = ctx.createOscillator();
    const panDepth = ctx.createGain();
    panLfo.frequency.value = 0.018;
    panDepth.gain.value = 0.12;
    panLfo.connect(panDepth);
    panDepth.connect(pan.pan);
    panLfo.start();

    function setChord(index, time) {
      const chord = CHORDS[index % CHORDS.length];
      bass.oscillator.frequency.setTargetAtTime(chord.bass, time, 2.2);

      padVoices.forEach((voice, voiceIndex) => {
        voice.oscillator.frequency.setTargetAtTime(chord.notes[voiceIndex], time, 2.8);
      });

      upperVoices[0].oscillator.frequency.setTargetAtTime(chord.notes[1] * 2, time, 3.2);
      upperVoices[1].oscillator.frequency.setTargetAtTime(chord.notes[2] * 2, time, 3.2);
    }

    // Melody notes are soft, rounded and widely spaced — no random chimes.
    function playNote(frequency, time, duration) {
      const voiceFilter = ctx.createBiquadFilter();
      voiceFilter.type = "lowpass";
      voiceFilter.frequency.setValueAtTime(1900, time);
      voiceFilter.frequency.exponentialRampToValueAtTime(950, time + duration);

      const voiceGain = ctx.createGain();
      voiceGain.gain.setValueAtTime(0.0001, time);
      voiceGain.gain.exponentialRampToValueAtTime(0.024, time + 0.22);
      voiceGain.gain.setValueAtTime(0.024, time + duration * 0.45);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      const tone = ctx.createOscillator();
      tone.type = "sine";
      tone.frequency.setValueAtTime(frequency, time);
      tone.connect(voiceFilter);
      voiceFilter.connect(voiceGain);
      voiceGain.connect(musicBus);
      tone.start(time);
      tone.stop(time + duration + 0.05);
      tone.addEventListener("ended", () => {
        tone.disconnect();
        voiceFilter.disconnect();
        voiceGain.disconnect();
      }, { once: true });
    }

    let nextNoteTime = ctx.currentTime + 2.5;
    let noteIndex = 0;
    let nextChordTime = ctx.currentTime + 0.1;
    let chordIndex = 0;

    function schedule(until) {
      while (nextChordTime < until) {
        setChord(chordIndex, nextChordTime);
        chordIndex = (chordIndex + 1) % CHORDS.length;
        nextChordTime += BEAT * 8;
      }

      while (nextNoteTime < until) {
        const [frequency, length] = MELODY[noteIndex % MELODY.length];
        // Leave deliberate gaps between phrases for a spacious soundtrack.
        if (noteIndex % 4 !== 3) {
          playNote(frequency, nextNoteTime, BEAT * length * 2.4);
        }
        noteIndex++;
        nextNoteTime += BEAT * 2;
      }
    }

    function transition(time = ctx.currentTime) {
      // A restrained low swell, not a loud white-noise whoosh.
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(95, time);
      oscillator.frequency.exponentialRampToValueAtTime(185, time + 0.55);
      oscillator.frequency.exponentialRampToValueAtTime(78, time + 1.65);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(TRANSITION_LEVEL, time + 0.48);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);

      oscillator.connect(gain);
      gain.connect(musicBus);
      oscillator.start(time);
      oscillator.stop(time + 1.9);
      oscillator.addEventListener("ended", () => {
        oscillator.disconnect();
        gain.disconnect();
      }, { once: true });
    }

    function fadeTo(level, seconds) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setTargetAtTime(level, now, Math.max(0.08, seconds / 3));
    }

    return { fadeTo, schedule, transition };
  }

  const button = document.getElementById("sound-toggle");
  if (!button) return;

  let context = null;
  let engine = null;
  let enabled = false;
  let scheduler = null;
  let suspendTimer = null;

  function updateButton() {
    button.classList.toggle("is-on", enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "Turn cinematic music off" : "Turn cinematic music on");
    button.title = enabled ? "Cinematic music is on" : "Play cinematic music";
  }

  function stopScheduler() {
    if (scheduler !== null) {
      window.clearInterval(scheduler);
      scheduler = null;
    }
  }

  function startScheduler() {
    if (!enabled || !context || context.state !== "running" || !engine || scheduler !== null) return;
    engine.schedule(context.currentTime + 12);
    scheduler = window.setInterval(() => {
      if (!enabled || !context || context.state !== "running") {
        stopScheduler();
        return;
      }
      engine.schedule(context.currentTime + 12);
    }, 3000);
  }

  async function turnOn() {
    if (!context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        button.title = "Audio is not supported by this browser.";
        return;
      }

      try {
        context = new AudioContextClass({ latencyHint: "interactive" });
        engine = buildEngine(context);
      } catch (error) {
        console.error("Starrex music could not be initialized:", error);
        if (context && context.state !== "closed") {
          await context.close().catch(() => {});
        }
        context = null;
        engine = null;
        return;
      }
    }

    window.clearTimeout(suspendTimer);
    await context.resume();
    if (context.state !== "running") return;

    enabled = true;
    updateButton();
    engine.fadeTo(MASTER_LEVEL, 3.5);
    startScheduler();
  }

  function turnOff() {
    if (!context || !engine) return;

    enabled = false;
    updateButton();
    stopScheduler();
    engine.fadeTo(0, 1.8);

    window.clearTimeout(suspendTimer);
    suspendTimer = window.setTimeout(() => {
      if (!enabled && context && context.state === "running") {
        context.suspend().catch(error => console.warn("Starrex audio pause failed:", error));
      }
    }, 2100);
  }

  button.addEventListener("click", async () => {
    try {
      if (enabled) turnOff();
      else await turnOn();
    } catch (error) {
      enabled = false;
      stopScheduler();
      updateButton();
      console.warn("Starrex music control failed:", error);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!context || !enabled) return;

    if (document.hidden) {
      stopScheduler();
      context.suspend().catch(error => console.warn("Starrex audio pause failed:", error));
    } else {
      context.resume().then(startScheduler).catch(error => {
        console.warn("Starrex audio resume failed:", error);
      });
    }
  });

  document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
      if (enabled && engine) engine.transition();
    });
  });

  window.starrexSound = {
    whoosh: () => {
      if (enabled && engine) engine.transition();
    },
    isOn: () => enabled
  };

  updateButton();
})();
