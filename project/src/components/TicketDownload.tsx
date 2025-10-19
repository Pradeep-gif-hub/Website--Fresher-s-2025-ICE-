import React, { useState, useEffect } from 'react';
import validStudents from '../data/validStudents.json';

// Countdown timing
const Countdown: React.FC = () => {
  const calculate = () => {
    // new Date(year, monthIndex, day, hour, minute, second)
    const properTarget = new Date(2025, 10, 1, 18, 0, 0); 
    const now = new Date();
    const diff = Math.max(0, properTarget.getTime() - now.getTime());
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return { days, hours, minutes, seconds, isPast: diff <= 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculate());
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const ambientStartedRef = React.useRef(false);
  const ambientIntervalRef = React.useRef<number | null>(null);
  const openingIntervalRef = React.useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(calculate());
    }, 1000);
    return () => {
      clearInterval(t);
      stopAmbient();
    };
  }, []);

  // Play short creepy sound on the hover of the countdown 
  const playCreepy = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
  if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
  const ctx = audioCtxRef.current;
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = 60; 
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      gain.gain.value = 0;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

  const now = ctx.currentTime;
      
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.start(now);
      osc.stop(now + 0.9);
      if (!ambientStartedRef.current) startAmbient(); // resolve adn reject
    } catch (e) {

    }
  };

  // start of the bg 
  const startAmbient = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const padGain = ctx.createGain();
      padGain.gain.value = 0.0001;
      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.value = 600;
      padFilter.Q.value = 1;

      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      oscA.type = 'sawtooth'; oscA.frequency.value = 55;
      oscB.type = 'sawtooth'; oscB.frequency.value = 55 * 1.005;

      oscA.connect(padFilter);
      oscB.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(ctx.destination);

      const now = ctx.currentTime;
      padGain.gain.setValueAtTime(0.0001, now);
      padGain.gain.linearRampToValueAtTime(0.12, now + 1.8);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine'; lfo.frequency.value = 0.04;
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain);
      lfoGain.connect(padFilter.frequency);

      oscA.start(now);
      oscB.start(now);
      lfo.start(now);

      const playPluck = () => {
        try {
          if (!audioCtxRef.current) return;
          const tctx = audioCtxRef.current as AudioContext;
          const pluckOsc = tctx.createOscillator();
          const pluckGain = tctx.createGain();
          pluckOsc.type = 'triangle';
          const base = 110;
          const scale = [0,3,7,10];
          const note = base * Math.pow(2, scale[Math.floor(Math.random()*scale.length)]/12);
          pluckOsc.frequency.value = note;
          pluckGain.gain.value = 0.0001;
          pluckOsc.connect(pluckGain);
          pluckGain.connect(tctx.destination);
          const t = tctx.currentTime;
          pluckGain.gain.setValueAtTime(0.0001,t);
          pluckGain.gain.linearRampToValueAtTime(0.18,t+0.02);
          pluckGain.gain.exponentialRampToValueAtTime(0.0001,t+0.6);
          pluckOsc.start(t);
          pluckOsc.stop(t+0.7);
        } catch(e) {}
      };

      ambientIntervalRef.current = window.setInterval(playPluck, 1500 + Math.random()*800) as unknown as number;
      // ticket webmixer
      try {
        const notes = [110, 130.81, 164.81, 220]; 
        let i = 0;
        openingIntervalRef.current = window.setInterval(() => {
          try {
            if (!audioCtxRef.current) return;
            const tctx = audioCtxRef.current as AudioContext;
            const now = tctx.currentTime;
            const o = tctx.createOscillator();
            const g = tctx.createGain();
            o.type = 'sawtooth';
            o.frequency.value = notes[i % notes.length] * (1 + (Math.random()-0.5)*0.02);
            g.gain.value = 0.0001;
            o.connect(g);
            g.connect(tctx.destination);
            g.gain.setValueAtTime(0.0001, now);
            g.gain.linearRampToValueAtTime(0.06, now + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5 + Math.random()*0.2);
            o.start(now);
            o.stop(now + 0.6 + Math.random()*0.2);
            i++;
          } catch(e) {}
        }, 300);
      } catch(e) {}
      ambientStartedRef.current = true;
      (audioCtxRef as any).padNodes = { oscA, oscB, lfo, padGain, padFilter };
    } catch(e) {}
  };

  const stopAmbient = () => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const nodes = (audioCtxRef as any).padNodes;
      if (nodes) {
        const { padGain, oscA, oscB, lfo } = nodes;
        const now = ctx.currentTime;
        if (padGain) {
          padGain.gain.cancelScheduledValues(now);
          padGain.gain.setValueAtTime(padGain.gain.value || 0.0001, now);
          padGain.gain.linearRampToValueAtTime(0.0001, now + 1.0);
        }
        try { if (oscA) oscA.stop(now + 1.05); } catch(_) {}
        try { if (oscB) oscB.stop(now + 1.05); } catch(_) {}
        try { if (lfo) lfo.stop(now + 1.05); } catch(_) {}
        if (ambientIntervalRef.current) { clearInterval(ambientIntervalRef.current); ambientIntervalRef.current = null; }
          if (openingIntervalRef.current) { clearInterval(openingIntervalRef.current); openingIntervalRef.current = null; }
        ambientStartedRef.current = false;
        (audioCtxRef as any).padNodes = null;
      }
    } catch(e) {}
  };

  if (timeLeft.isPast) {
    return <p className="text-sm text-gray-300">The event has started.</p>;
  }

  return (
    <div className="countdown-wrapper" title="Hover to hide the countdown" onMouseEnter={playCreepy}>
      <div className="countdown mb-4 flex gap-3 justify-center">
        <div className="time-pill bg-gray-900/60 px-3 py-2 rounded text-center">
          <div className="text-2xl font-mono">{timeLeft.days}</div>
          <div className="text-xs text-gray-400">days</div>
        </div>
        <div className="time-pill bg-gray-900/60 px-3 py-2 rounded text-center">
          <div className="text-2xl font-mono">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-xs text-gray-400">hrs</div>
        </div>
        <div className="time-pill bg-gray-900/60 px-3 py-2 rounded text-center">
          <div className="text-2xl font-mono">{String(timeLeft.minutes).padStart(2, '0')}</div>
          <div className="text-xs text-gray-400">min</div>
        </div>
        <div className="time-pill bg-gray-900/60 px-3 py-2 rounded text-center">
          <div className="text-2xl font-mono">{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className="text-xs text-gray-400">sec</div>
        </div>
      </div>
    </div>
  );
};

const TicketDownload = () => {
  const [email, setEmail] = useState(sessionStorage.getItem('userEmail') || '');
  const [showTicket, setShowTicket] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  // final creepy audio refs
  const finalAudioRef = React.useRef<{ ctx?: AudioContext; intervals?: number[]; nodes?: any } | null>(null);

  // start final creepy sequence: bats, chair creaks, screams
  const startFinalCreepy = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!finalAudioRef.current) finalAudioRef.current = {};
      if (!finalAudioRef.current.ctx) finalAudioRef.current.ctx = new AudioCtx();
      const ctx = finalAudioRef.current.ctx as AudioContext;

      // utility: create noise buffer
      const bufferSize = ctx.sampleRate * 1.0;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) output[i] = Math.random()*2-1;

      // BAT FLUTTER: rapid short noise bursts, panned
      const batBurst = () => {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        const slice = ctx.createGain();
        slice.gain.value = 0;
        const band = ctx.createBiquadFilter();
        band.type = 'highpass'; band.frequency.value = 1200 + Math.random()*3000;
        const pan = (ctx as any).createStereoPanner ? ctx.createStereoPanner() : null;
        src.connect(band);
        band.connect(slice);
        if (pan) slice.connect(pan); else slice.connect(ctx.destination);
        if (pan) pan.connect(ctx.destination);
        const t = ctx.currentTime;
        slice.gain.setValueAtTime(0.0001, t);
        slice.gain.linearRampToValueAtTime(0.5, t+0.005 + Math.random()*0.02);
        slice.gain.exponentialRampToValueAtTime(0.0001, t+0.09 + Math.random()*0.12);
        if (pan) pan.pan.setValueAtTime((Math.random()*2-1), t);
        src.start(t);
        src.stop(t+0.12 + Math.random()*0.12);
      };

      // CHAIR CREAKS: low filtered noise spikes
      const chairCreak = () => {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        const g = ctx.createGain();
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 400 + Math.random()*600;
        src.connect(f); f.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.6, t+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t+0.9 + Math.random()*1.2);
        src.start(t); src.stop(t+1.2);
      };

      // EXTREME GHOST SCREAM: layered oscillators, harsh waveshaping, noise shrieks, feedback delay and random pitch disruption
      const screamOnce = () => {
        try {
          const t = ctx.currentTime + 0.02;

          const makeShaper = (amount = 80) => {
            const n = 16384;
            const curve = new Float32Array(n);
            const k = amount;
            for (let i = 0; i < n; i++) {
              const x = (i * 2) / n - 1;
              curve[i] = Math.tanh(x * (1 + k/20));
            }
            return curve;
          };

          // master chain and heavy feedback delay for echos
          const master = ctx.createGain(); master.gain.value = 0.0001;
          const delay = ctx.createDelay(); delay.delayTime.value = 0.12 + Math.random()*0.25;
          const fb = ctx.createGain(); fb.gain.value = 0.45 + Math.random()*0.45;
          const wet = ctx.createGain(); wet.gain.value = 0.7;
          master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet);
          wet.connect(ctx.destination); master.connect(ctx.destination);

          // low rumble layer
          const lowGain = ctx.createGain(); lowGain.gain.value = 0.0001; lowGain.connect(master);
          const lowA = ctx.createOscillator(); lowA.type = 'sawtooth'; lowA.frequency.value = 40 + Math.random()*30;
          const lowB = ctx.createOscillator(); lowB.type = 'sine'; lowB.frequency.value = 41 + Math.random()*10;
          lowA.connect(lowGain); lowB.connect(lowGain);
          lowA.start(t); lowB.start(t); lowA.stop(t + 4 + Math.random()*3); lowB.stop(t + 4 + Math.random()*3);

          // mid harsh scream layer through heavy shaper
          const midShaper = ctx.createWaveShaper(); midShaper.curve = makeShaper(220); midShaper.oversample = '4x';
          const midGain = ctx.createGain(); midGain.gain.value = 0.0001; midGain.connect(master);
          const midOsc1 = ctx.createOscillator(); midOsc1.type = 'sawtooth';
          const midOsc2 = ctx.createOscillator(); midOsc2.type = 'sawtooth';
          midOsc1.frequency.value = 220 + Math.random()*160; midOsc2.frequency.value = midOsc1.frequency.value * (0.99 + Math.random()*0.04);
          midOsc1.connect(midShaper); midOsc2.connect(midShaper); midShaper.connect(midGain);
          midOsc1.start(t); midOsc2.start(t);

          // high shriek using noise filtered
          const nb = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
          const dat = nb.getChannelData(0); for (let i=0;i<dat.length;i++) dat[i] = (Math.random()*2-1) * (Math.random()*0.6);
          const noiseSrc = ctx.createBufferSource(); noiseSrc.buffer = nb;
          const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900 + Math.random()*4000;
          const highGain = ctx.createGain(); highGain.gain.value = 0.0001; highGain.connect(master);
          noiseSrc.connect(hp); hp.connect(highGain);
          noiseSrc.start(t); noiseSrc.stop(t + 1.6 + Math.random()*2.4);

          // envelopes and sweeps
          midGain.gain.setValueAtTime(0.0001, t);
          midGain.gain.linearRampToValueAtTime(1.2 + Math.random()*0.8, t + 0.02);
          midGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.6 + Math.random()*2.5);

          highGain.gain.setValueAtTime(0.0001, t);
          highGain.gain.linearRampToValueAtTime(1.0, t + 0.01);
          highGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.0 + Math.random()*2.0);

          // formant/bandpass applied to master to make it vocal
          const form = ctx.createBiquadFilter(); form.type = 'bandpass'; form.Q.value = 1.2;
          master.connect(form); form.connect(ctx.destination);
          form.frequency.setValueAtTime(450 + Math.random()*200, t);
          form.frequency.exponentialRampToValueAtTime(1800 + Math.random()*2000, t + 1.0 + Math.random()*1.2);

          // pitch chaos: random small detunes during the scream
          const chaosCount = 3 + Math.floor(Math.random()*4);
          for (let i=0;i<chaosCount;i++) {
            const when = t + 0.05 + Math.random()*1.2;
            midOsc1.frequency.exponentialRampToValueAtTime(midOsc1.frequency.value * (1 + (Math.random()*0.8 - 0.4)), when + 0.02);
            midOsc2.frequency.exponentialRampToValueAtTime(midOsc2.frequency.value * (1 + (Math.random()*0.8 - 0.4)), when + 0.02);
          }

          // stop oscillators after tail
          midOsc1.stop(t + 3.6 + Math.random()*2.4); midOsc2.stop(t + 3.6 + Math.random()*2.4);

        } catch (e) {
          // ignore
        }
      };

      // schedule repeating patterns
      const intervals: number[] = [];
      intervals.push(window.setInterval(batBurst, 300 + Math.random()*300) as unknown as number);
      intervals.push(window.setInterval(chairCreak, 2200 + Math.random()*1800) as unknown as number);
      // occasional scream every ~8-18s
      intervals.push(window.setInterval(() => { if (Math.random() < 0.6) screamOnce(); }, 8000 + Math.random()*10000) as unknown as number);

      finalAudioRef.current!.intervals = intervals;
      finalAudioRef.current!.nodes = { noiseBuffer };
    } catch (e) {
      // ignore
    }
  };

  const stopFinalCreepy = () => {
    try {
      const entry = finalAudioRef.current;
      if (!entry) return;
      if (entry.intervals) {
        entry.intervals.forEach((id) => clearInterval(id));
        entry.intervals = [];
      }
      // cannot stop bufferSource nodes after they've been scheduled here; just clear refs
      if (entry.ctx) {
        try { entry.ctx.close(); } catch(_) {}
      }
      finalAudioRef.current = null;
    } catch(e) {}
  };

  // trigger final creepy sounds when ticket opens
  useEffect(() => {
    if (showTicket) {
      startFinalCreepy();
    } else {
      stopFinalCreepy();
    }
    return () => { stopFinalCreepy(); };
  }, [showTicket]);

  useEffect(() => {
    document.body.classList.remove('cursed');

    if (email) {
      const validEmailPattern = /\.ic\.(22|23|24|25)@nitj\.ac\.in$/;
      if (validEmailPattern.test(email)) {
        setStudentEmail(email);
        setShowSuccess(true);
        setTimeout(() => {
          setShowTicket(true);
        }, 1500);
      }
    }

    return () => {
      document.body.classList.remove('cursed');
    };
  }, [email]);

  const verifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowSuccess(false);

    const validEmailPattern = /\.ic\.(22|23|24|25)@nitj\.ac\.in$/;
    if (validEmailPattern.test(email)) {
      setStudentEmail(email);
      setShowSuccess(true);
      setTimeout(() => {
        setShowTicket(true);
      }, 1500);
    } else {
      setError('🦇 CURSED BY VECNA! 🦇');
      document.body.classList.add('cursed');
      setTimeout(() => {
        document.body.classList.remove('cursed');
      }, 1000);
    }
  };

  if (showSuccess && !showTicket) {
    return (
      <div className="ticket-container verification-success">
        <div className="stranger-title font">{validStudents.event_details.name}</div>
        <div className="strange-lights">
          {[...Array(10)].map((_, i) => <div key={i} className="light"></div>)}
        </div>
        <p className="success-message font">Opening the gate to the Upside Down...</p>
      </div>
    );
  }

  return (
    <div className={`ticket-container ${showTicket ? 'hawkins-theme' : ''}`}>
      {!showTicket ? (
        <div className="verification-form">
          {/* Countdown to the event (1 Nov 2025 18:00) */}
          <div className="countdown-wrapper" title="Hover to hide the countdown">
            <Countdown />
          </div>
          <div className="stranger-title font stroked-text">{validStudents.event_details.name}</div>
          <div className="strange-lights">
            {[...Array(10)].map((_, i) => <div key={i} className="light"></div>)}
          </div>
          <div className="fog absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 pointer-events-none"></div>
          <p className="event-intro text-[#e81919] text-lg font-semibold tracking-wide">
            The Gate to Freshers Party is about to open ...
          </p>
          <form onSubmit={verifyEmail}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="Enter your NITJ email"
              required
              className="hawkins-input"
            />
            <button type="submit" className="hawkins-btn font">Open The Gate</button>
          </form>
          {error && <p className="vecna-curse font">{error}</p>}
        </div>
      ) : (
        <div className="ticket hawkins-lab">
          <div className="fog absolute top-0 left-0 w-full h-full pointer-events-none opacity-20"></div>
          <div className="ticket-header">
            <div className="stranger-title font stroked-text-light">{validStudents.event_details.name}</div>
            <div className="classified-stamp font">TOP SECRET</div>
          </div>
          <div className="ticket-body relative z-10">
            <div className="ticket-details">
              <p className="detail-line">
                <span className="detail-label font">VECNA’S TARGET ID:</span>
                <span className="detail-value">{studentEmail}</span>
              </p>
              <p className="detail-line">
                <span className="detail-label font">LOCATION OF THE RIFT:</span>
                <span className="detail-value">{validStudents.event_details.venue}</span>
              </p>
              <p className="detail-line">
                <span className="detail-label font">WHEN THE DARKNESS RISES:</span>
                <span className="detail-value">{new Date(validStudents.event_details.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </p>
              <p className="detail-line">
                <span className="detail-label font">TIME OF VECNA'S RISE:</span>
                <span className="detail-value">{validStudents.event_details.time}</span>
              </p>
              <p className="detail-line">
                <span className="detail-label font">THE CHOSEN HOUR:</span>
                <span className="detail-value">{validStudents.event_details.duration}</span>
              </p>
              <p className="detail-line">
                <span className="detail-label font">CODE OF THE CURSED:</span>
                <span className="detail-value">{validStudents.event_details.dress_code}</span>
              </p>
            </div>
            <div className="hawkins-warning">
              <div className="warning-tape"></div>
              <p className="font text-center py-3"><strong>⚠ WARNING ⚠</strong></p>
              <p className="text-center">{validStudents.event_details.important_note}</p>
              <div className="warning-tape"></div>
            </div>
            <div className="upside-down-portal">
              <div className="portal-ring"></div>
              <div className="portal-ring"></div>
              <div className="portal-ring"></div>
            </div>
          </div>
          <div className="ticket-footer">
            <button onClick={() => window.print()} className="hawkins-btn download-button font">
              PROPERTY OF HAWKINS LAB — DO NOT COPY
            </button>
          </div>
          <div className="strange-lights bottom">
            {[...Array(10)].map((_, i) => <div key={i} className="light"></div>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDownload;
