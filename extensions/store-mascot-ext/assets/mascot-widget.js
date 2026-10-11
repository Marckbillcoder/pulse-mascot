// <store-mascot> Shopify Theme App Extension Web Component
// High-Converting Gamified AOV & Cart Conversion Engine
(function () {
  'use strict';

  const STATES = { IDLE: 'IDLE', CELEBRATE: 'CELEBRATE', SAD: 'SAD', NUDGE: 'NUDGE' };
  const PERSONAS = { ORB: 'orb', PET: 'pet', BOBA: 'boba', GHOST: 'ghost', DRAGON: 'dragon' };
  const FETCH_KEY = '__storeMascotFetchInterceptor__';
  const STORAGE_ANALYTICS_KEY = '__storeMascotAnalytics__';
  const SESSION_EXIT_KEY = '__storeMascotExitTriggered__';

  // --- Safe Shopify Fetch Interceptor (Intercepts /cart/add, /cart/change, /cart/update, /cart/clear) ---
  function ensureFetchInterceptor() {
    if (window[FETCH_KEY]) return window[FETCH_KEY];
    const subscribers = new Set();
    const wrapFetch = (baseFetch) => {
      if (typeof baseFetch !== 'function' || baseFetch.__isMascotWrapper) return baseFetch;
      const wrapped = async function (...args) {
        const res = await baseFetch.apply(this, args);
        try {
          const input = args[0];
          const url = typeof input === 'string' ? input : (input && input.url) || '';
          if (url && /\/cart\/(add|change|update|clear)(\.js)?(\?|$)|\/cart\.js(\?|$)/i.test(url)) {
            res.clone().json().then((data) => {
              subscribers.forEach((fn) => {
                try { fn(url, data, args[1]); } catch (_) {}
              });
            }).catch(() => {});
          }
        } catch (_) {}
        return res;
      };
      Object.assign(wrapped, baseFetch);
      wrapped.__isMascotWrapper = true;
      return wrapped;
    };

    let currentFetch = wrapFetch(window.fetch);
    try {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        enumerable: true,
        get: () => currentFetch,
        set: (fn) => { currentFetch = wrapFetch(fn); },
      });
    } catch (_) {
      window.fetch = currentFetch;
    }

    return (window[FETCH_KEY] = {
      subscribe(fn) {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },
    });
  }

  // --- Zero-Asset Web Audio Micro-Chimes Synth ---
  class MascotSynth {
    constructor() {
      this._ctx = null;
    }
    _init() {
      if (!this._ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this._ctx = new AC();
      }
      if (this._ctx && this._ctx.state === 'suspended') {
        this._ctx.resume().catch(() => {});
      }
      return this._ctx;
    }
    play(type) {
      try {
        const ctx = this._init();
        if (!ctx) return;
        const now = ctx.currentTime;
        if (type === 'celebrate') {
          // Melodic celebratory arpeggio: C5, E5, G5, C6
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.075);
            gain.gain.setValueAtTime(0.001, now + idx * 0.075);
            gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.075 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.075 + 0.38);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.075);
            osc.stop(now + idx * 0.075 + 0.4);
          });
        } else if (type === 'sad') {
          // Soft descending melancholic tone: G4 -> Eb4 -> C4
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(392.0, now);
          osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.35);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.4);
        } else if (type === 'pop') {
          // Crisp bubbly pop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.05);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.07);
        }
      } catch (_) {}
    }
  }

  // --- Local ROI Attribution Engine ---
  class MascotAnalytics {
    static get() {
      try {
        const raw = localStorage.getItem(STORAGE_ANALYTICS_KEY);
        return raw ? JSON.parse(raw) : this.initial();
      } catch (_) {
        return this.initial();
      }
    }
    static initial() {
      return {
        impressions: 0,
        interactions: 0,
        milestonesReached: 0,
        exitOffersShown: 0,
        exitOffersConverted: 0,
        attributedRevenue: 0,
        installedAt: Date.now(),
      };
    }
    static record(key, amount = 1) {
      try {
        const data = this.get();
        if (typeof data[key] === 'number') {
          data[key] += amount;
          localStorage.setItem(STORAGE_ANALYTICS_KEY, JSON.stringify(data));
        }
      } catch (_) {}
    }
    static reset() {
      try {
        localStorage.removeItem(STORAGE_ANALYTICS_KEY);
      } catch (_) {}
    }
  }

  const STYLES = `
:host {
  --surface: rgba(15, 23, 42, 0.94);
  --border: rgba(255, 255, 255, 0.14);
  --text: #f8fafc;
  --sub: #94a3b8;
  --accent: #6366f1;
  --accent-glow: rgba(99, 102, 241, 0.35);
  --mascot-offset-x: 24px;
  --mascot-offset-y: 24px;
  position: fixed;
  right: var(--mascot-offset-x);
  bottom: var(--mascot-offset-y);
  left: auto;
  z-index: 2147483000;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
  line-height: 1.4;
  color: var(--text);
  user-select: none;
  -webkit-font-smoothing: antialiased;
  pointer-events: none;
  transition: right .22s ease, left .22s ease, bottom .22s ease;
}
:host([position="bottom-left"]) {
  left: var(--mascot-offset-x);
  right: auto;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.mascot-shell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
}
:host([position="bottom-left"]) .mascot-shell {
  align-items: flex-start;
}

.confetti-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: -1;
}

/* Speech Bubble */
.speech-bubble {
  position: relative;
  max-width: 290px;
  min-width: 220px;
  background: var(--surface);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid var(--border);
  border-radius: 18px 18px 6px 18px;
  padding: 13px 15px;
  box-shadow: 0 20px 42px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset;
  color: var(--text);
  transform-origin: bottom right;
  opacity: 0;
  transform: translateY(10px) scale(0.92);
  transition: opacity .26s cubic-bezier(.16,1,.3,1), transform .32s cubic-bezier(.34,1.56,.64,1), border-color .25s ease;
  pointer-events: none;
  margin-bottom: 4px;
}
:host([position="bottom-left"]) .speech-bubble {
  border-radius: 18px 18px 18px 6px;
  transform-origin: bottom left;
}
.speech-bubble.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.speech-bubble[data-tone="celebrate"] {
  border-color: rgba(16,185,129,0.6);
  box-shadow: 0 20px 42px -10px rgba(16,185,129,0.32), 0 0 0 1px rgba(16,185,129,0.2) inset;
}
.speech-bubble[data-tone="nudge"], .speech-bubble[data-tone="exit"] {
  border-color: rgba(245,158,11,0.6);
  animation: bubblePulse 2.4s ease-in-out infinite;
}
.speech-bubble[data-tone="sad"] {
  border-color: rgba(96,165,250,0.55);
}

.bubble-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.bubble-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: #a5b4fc;
  margin-bottom: 4px;
}
.speech-bubble[data-tone="celebrate"] .bubble-badge { color: #34d399; }
.speech-bubble[data-tone="nudge"] .bubble-badge, .speech-bubble[data-tone="exit"] .bubble-badge { color: #fbbf24; }
.speech-bubble[data-tone="sad"] .bubble-badge { color: #93c5fd; }

.bubble-close {
  appearance: none;
  border: none;
  background: rgba(255,255,255,0.08);
  color: var(--sub);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 11px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .15s, color .15s;
  flex-shrink: 0;
}
.bubble-close:hover { background: rgba(255,255,255,0.22); color: #fff; }

.bubble-message {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -.01em;
  word-break: break-word;
}

/* Multi-Tier Progress Meter */
.shipping-meter {
  margin-top: 10px;
  position: relative;
}
.shipping-meter.hidden { display: none; }
.meter-track {
  height: 6px;
  width: 100%;
  background: rgba(255,255,255,0.12);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}
.shipping-meter-fill {
  height: 100%;
  width: 0%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6366f1, #ec4899, #10b981);
  background-size: 200% 100%;
  transition: width .5s cubic-bezier(.22,1,.36,1);
  animation: shimmerBar 3s linear infinite;
}
.meter-tiers-label {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 9.5px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: .02em;
}
.tier-tag.reached { color: #34d399; font-weight: 700; }

/* Exit-Intent Discount CTA Button */
.exit-cta-container {
  margin-top: 10px;
  display: none;
}
.exit-cta-container.visible {
  display: block;
}
.exit-cta-btn {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 0 4px 14px rgba(16,185,129,0.36);
  transition: transform .18s, box-shadow .18s, filter .18s;
}
.exit-cta-btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.1);
  box-shadow: 0 6px 18px rgba(16,185,129,0.5);
}

/* Mascot Stage & Character */
.mascot-stage {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
.mascot-stage:focus-visible .mascot-svg, :host([data-editor-selected="true"]) .mascot-svg {
  filter: drop-shadow(0 0 0 3px #818cf8) drop-shadow(0 12px 22px rgba(79,70,229,0.5));
}
.mascot-svg {
  width: 96px;
  height: 96px;
  overflow: visible;
  filter: drop-shadow(0 12px 22px rgba(79,70,229,0.36));
  transition: filter .35s, transform .3s cubic-bezier(.34,1.56,.64,1);
}
.mascot-stage:hover .mascot-svg { transform: scale(1.06); }
.mascot-stage:active .mascot-svg { transform: scale(0.94); }

.character-root { transform-origin: 50px 52px; }
:host([data-state="IDLE"]) .character-root { animation: floatIdle 3.8s ease-in-out infinite; }
:host([data-state="CELEBRATE"]) .character-root { animation: celebrateBounce .65s cubic-bezier(.34,1.56,.64,1) infinite; }
:host([data-state="SAD"]) .character-root { animation: sadShudder 2.2s ease-in-out infinite; }
:host([data-state="SAD"]) .mascot-svg { filter: drop-shadow(0 10px 18px rgba(59,130,246,0.32)); }
:host([data-state="NUDGE"]) .character-root { animation: nudgeLean 1.5s ease-in-out infinite; }

/* Persona Swapping */
.persona-orb, .persona-pet, .persona-boba { display: none; }
:host(:not([persona])) .persona-orb,
:host([persona="orb"]) .persona-orb { display: inline; }
:host([persona="pet"]) .persona-pet { display: inline; }
:host([persona="boba"]) .persona-boba { display: inline; }

/* Emotional Eye Expressions */
.eyes-idle, .eyes-celebrate, .eyes-sad, .eyes-nudge {
  opacity: 0;
  transition: opacity .16s;
  pointer-events: none;
}
:host([data-state="IDLE"]) .eyes-idle,
:host([data-state="CELEBRATE"]) .eyes-celebrate,
:host([data-state="SAD"]) .eyes-sad,
:host([data-state="NUDGE"]) .eyes-nudge {
  opacity: 1;
}

.eyelid-blink { transform-origin: 50px 48px; animation: naturalBlink 5.2s infinite; }
.tear-left { animation: tearDrop 1.4s ease-in infinite; transform-origin: 33px 55px; }
.tear-right { animation: tearDrop 1.4s ease-in .55s infinite; transform-origin: 67px 55px; }
.celebrate-sparkles { opacity: 0; transform-origin: 50px 50px; transition: opacity .2s; }
:host([data-state="CELEBRATE"]) .celebrate-sparkles { opacity: 1; animation: sparkleSpin 2.2s linear infinite; }

/* Persona-specific animations */
:host([persona="pet"]) .pet-ear-left { transform-origin: 24px 28px; transition: transform .3s; }
:host([persona="pet"]) .pet-ear-right { transform-origin: 76px 28px; transition: transform .3s; }
:host([persona="pet"][data-state="CELEBRATE"]) .pet-ear-left { animation: earWiggle .5s ease-in-out infinite alternate; }
:host([persona="pet"][data-state="CELEBRATE"]) .pet-ear-right { animation: earWiggle .5s ease-in-out infinite alternate-reverse; }
:host([persona="pet"][data-state="SAD"]) .pet-ear-left { transform: rotate(-18deg) translateY(4px); }
:host([persona="pet"][data-state="SAD"]) .pet-ear-right { transform: rotate(18deg) translateY(4px); }

:host([persona="boba"][data-state="CELEBRATE"]) .boba-pearl { animation: pearlBob .6s ease-in-out infinite alternate; }

/* Branding Badge (Viral Growth Engine) */
.branding-footer {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(15,23,42,0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .01em;
  text-decoration: none;
  pointer-events: auto;
  transition: color .2s, background .2s, transform .2s, border-color .2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}
.branding-footer:hover {
  background: rgba(15,23,42,0.98);
  color: #fff;
  border-color: rgba(129,140,248,0.5);
  transform: translateY(-1px);
}
.branding-footer.hidden { display: none !important; }
.branding-footer strong {
  font-weight: 700;
  background: linear-gradient(90deg, #a5b4fc, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.branding-bolt { width: 10px; height: 10px; fill: #fbbf24; flex-shrink: 0; }

@keyframes floatIdle {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-6px) scale(1.015, .988); }
}
@keyframes celebrateBounce {
  0%, 100% { transform: translateY(0) scale(1) rotate(0); }
  28% { transform: translateY(-12px) scale(.95, 1.06) rotate(-4deg); }
  55% { transform: translateY(-4px) scale(1.05, .96) rotate(4deg); }
  80% { transform: translateY(-9px) scale(.98, 1.03) rotate(-2deg); }
}
@keyframes sadShudder {
  0%, 100% { transform: translateY(4px) rotate(0) scale(.97, .95); }
  25% { transform: translateY(5px) translateX(-1.8px) rotate(-2deg) scale(.96, .95); }
  50% { transform: translateY(5px) translateX(1.8px) rotate(2deg) scale(.96, .95); }
  75% { transform: translateY(6px) translateX(-1.2px) rotate(-1deg) scale(.96, .94); }
}
@keyframes nudgeLean {
  0%, 100% { transform: translate(0,0) rotate(0); }
  50% { transform: translate(-5px,-4px) rotate(-5deg) scale(1.03); }
}
@keyframes naturalBlink {
  0%, 92%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(.06); }
}
@keyframes tearDrop {
  0% { opacity: 0; transform: translateY(0) scale(.6); }
  25% { opacity: .95; transform: translateY(3px) scale(1); }
  85% { opacity: .9; transform: translateY(14px) scale(.9); }
  100% { opacity: 0; transform: translateY(18px) scale(.4); }
}
@keyframes sparkleSpin {
  0% { transform: rotate(0) scale(.96); }
  50% { transform: rotate(180deg) scale(1.06); }
  100% { transform: rotate(360deg) scale(.96); }
}
@keyframes bubblePulse {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.015); }
}
@keyframes shimmerBar {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes earWiggle {
  0% { transform: rotate(-8deg); }
  100% { transform: rotate(8deg); }
}
@keyframes pearlBob {
  0% { transform: translateY(0); }
  100% { transform: translateY(-3px); }
}
@media (prefers-reduced-motion: reduce) {
  .character-root, .speech-bubble[data-tone="nudge"], .eyelid-blink, .celebrate-sparkles {
    animation: none !important;
  }
}
`;

  const HTML = `
<canvas class="confetti-canvas" width="1" height="1" aria-hidden="true"></canvas>
<div class="mascot-shell">
  <div class="speech-bubble" role="status" aria-live="polite" data-tone="idle">
    <div class="bubble-header">
      <span class="bubble-badge">Store Companion</span>
      <button class="bubble-close" type="button" aria-label="Dismiss message">&times;</button>
    </div>
    <div class="bubble-message"></div>
    <div class="shipping-meter hidden" aria-hidden="true">
      <div class="meter-track"><div class="shipping-meter-fill"></div></div>
      <div class="meter-tiers-label">
        <span class="tier-tag tier-1-tag">Tier 1</span>
        <span class="tier-tag tier-2-tag">Tier 2</span>
        <span class="tier-tag tier-3-tag">VIP</span>
      </div>
    </div>
    <div class="exit-cta-container">
      <a class="exit-cta-btn" href="/checkout"></a>
    </div>
  </div>

  <div class="mascot-stage" tabindex="0" role="button" aria-label="Store mascot companion">
    <svg class="mascot-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <!-- Orb Gradients -->
        <radialGradient id="orbGradIdle" cx="35%" cy="28%" r="70%"><stop offset="0%" stop-color="#a5b4fc"/><stop offset="45%" stop-color="#6366f1"/><stop offset="100%" stop-color="#312e81"/></radialGradient>
        <radialGradient id="orbGradCelebrate" cx="35%" cy="28%" r="70%"><stop offset="0%" stop-color="#6ee7b7"/><stop offset="45%" stop-color="#6366f1"/><stop offset="100%" stop-color="#4338ca"/></radialGradient>
        <radialGradient id="orbGradSad" cx="38%" cy="35%" r="70%"><stop offset="0%" stop-color="#93c5fd"/><stop offset="55%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1e3a8a"/></radialGradient>
        <radialGradient id="orbGradNudge" cx="35%" cy="28%" r="70%"><stop offset="0%" stop-color="#fde68a"/><stop offset="40%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#4c1d95"/></radialGradient>
        <radialGradient id="auraGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#818cf8" stop-opacity="0.65"/><stop offset="100%" stop-color="#818cf8" stop-opacity="0"/></radialGradient>
        <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1e1b4b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient>

        <!-- Pet Gradients -->
        <radialGradient id="petBodyGrad" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#fed7aa"/><stop offset="55%" stop-color="#f97316"/><stop offset="100%" stop-color="#c2410c"/></radialGradient>
        <radialGradient id="petEarGrad" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#fecdd3"/><stop offset="100%" stop-color="#f43f5e"/></radialGradient>

        <!-- Boba Gradients -->
        <linearGradient id="bobaCupGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(254,243,199,0.92)"/><stop offset="60%" stop-color="rgba(251,191,36,0.85)"/><stop offset="100%" stop-color="rgba(217,119,6,0.95)"/></linearGradient>
        <linearGradient id="bobaTeaGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#d97706"/></linearGradient>

        <!-- Ghost Gradients -->
        <radialGradient id="ghostGrad" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#ffffff"/><stop offset="60%" stop-color="#e0e7ff"/><stop offset="100%" stop-color="#a5b4fc"/></radialGradient>
        <radialGradient id="ghostAuraGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#c084fc" stop-opacity="0.5"/><stop offset="100%" stop-color="#c084fc" stop-opacity="0"/></radialGradient>

        <!-- Dragon Gradients -->
        <radialGradient id="dragonBodyGrad" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#a7f3d0"/><stop offset="55%" stop-color="#10b981"/><stop offset="100%" stop-color="#047857"/></radialGradient>
        <radialGradient id="dragonHornGrad" cx="30%" cy="20%" r="80%"><stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient>
      </defs>

      <!-- Common Ground Shadow & Confetti Sparkles -->
      <ellipse class="ground-shadow" cx="50" cy="91" rx="24" ry="4.5" fill="rgba(15,23,42,0.32)"/>
      <g class="celebrate-sparkles">
        <path d="M14 26 L16 31 L21 33 L16 35 L14 40 L12 35 L7 33 L12 31 Z" fill="#fbbf24"/>
        <path d="M86 22 L87.5 26 L91.5 27.5 L87.5 29 L86 33 L84.5 29 L80.5 27.5 L84.5 26 Z" fill="#34d399"/>
        <circle cx="15" cy="70" r="2.5" fill="#f472b6"/>
        <circle cx="87" cy="66" r="2.5" fill="#60a5fa"/>
      </g>

      <g class="character-root" stroke-linecap="round">

        <!-- ================= PERSONA 1: ORB ================= -->
        <g class="persona-orb">
          <circle class="aura-halo" cx="50" cy="52" r="42" fill="url(#auraGrad)" opacity="0.45"/>
          <g class="antenna-group">
            <path d="M50 22 Q50 13 55 10" fill="none" stroke="#818cf8" stroke-width="3"/>
            <circle class="antenna-tip" cx="56" cy="9.5" r="4.2" fill="#a5b4fc"/>
            <circle cx="54.8" cy="8.2" r="1.4" fill="#fff" opacity="0.9"/>
          </g>
          <g class="ears-group">
            <rect x="12" y="44" width="7" height="16" rx="3.5" fill="#4f46e5"/>
            <rect x="81" y="44" width="7" height="16" rx="3.5" fill="#4f46e5"/>
          </g>
          <circle class="orb-body-base" cx="50" cy="52" r="32" fill="url(#orbGradIdle)"/>
          <ellipse cx="39" cy="31" rx="13" ry="6.5" transform="rotate(-22 39 31)" fill="rgba(255,255,255,0.28)"/>
          <circle cx="29" cy="38" r="2.3" fill="rgba(255,255,255,0.22)"/>
          <rect x="24" y="35" width="52" height="33" rx="16.5" fill="url(#visorGrad)" stroke="rgba(255,255,255,0.14)" stroke-width="1.2"/>
          <ellipse cx="31" cy="56.5" rx="4.6" ry="2.4" fill="#f472b6" opacity="0.45"/>
          <ellipse cx="69" cy="56.5" rx="4.6" ry="2.4" fill="#f472b6" opacity="0.45"/>
        </g>

        <!-- ================= PERSONA 2: PET (Cute Cat/Dog) ================= -->
        <g class="persona-pet">
          <!-- Ears -->
          <g class="pet-ear-left">
            <polygon points="20,40 30,16 44,32" fill="#ea580c"/>
            <polygon points="24,37 31,21 40,32" fill="url(#petEarGrad)"/>
          </g>
          <g class="pet-ear-right">
            <polygon points="80,40 70,16 56,32" fill="#ea580c"/>
            <polygon points="76,37 69,21 60,32" fill="url(#petEarGrad)"/>
          </g>
          <!-- Body -->
          <circle cx="50" cy="54" r="33" fill="url(#petBodyGrad)"/>
          <!-- Whiskers -->
          <line x1="16" y1="52" x2="28" y2="53" stroke="rgba(255,255,255,0.5)" stroke-width="1.6"/>
          <line x1="15" y1="58" x2="28" y2="56" stroke="rgba(255,255,255,0.5)" stroke-width="1.6"/>
          <line x1="84" y1="52" x2="72" y2="53" stroke="rgba(255,255,255,0.5)" stroke-width="1.6"/>
          <line x1="85" y1="58" x2="72" y2="56" stroke="rgba(255,255,255,0.5)" stroke-width="1.6"/>
          <!-- Little Collar with Gold Bell -->
          <path d="M30 78 Q50 86 70 78" stroke="#0ea5e9" stroke-width="4.5" fill="none"/>
          <circle cx="50" cy="84" r="4.2" fill="#fbbf24" stroke="#d97706" stroke-width="1"/>
          <!-- Cute Nose -->
          <path d="M47 55 L53 55 L50 58 Z" fill="#f43f5e"/>
          <!-- Blush -->
          <circle cx="31" cy="57" r="4.5" fill="#fda4af" opacity="0.6"/>
          <circle cx="69" cy="57" r="4.5" fill="#fda4af" opacity="0.6"/>
        </g>

        <!-- ================= PERSONA 3: BOBA (Bubbly Cup) ================= -->
        <g class="persona-boba">
          <!-- Straw -->
          <polygon points="46,30 52,8 58,10 52,30" fill="#ec4899"/>
          <circle cx="55" cy="9" r="3" fill="#f472b6"/>
          <!-- Dome Lid -->
          <path d="M25 36 Q50 16 75 36 Z" fill="rgba(255,255,255,0.4)" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
          <rect x="22" y="34" width="56" height="5" rx="2.5" fill="#ffffff" opacity="0.9"/>
          <!-- Cup Body -->
          <path d="M26 39 L32 84 Q50 90 68 84 L74 39 Z" fill="url(#bobaCupGrad)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
          <!-- Boba Pearls -->
          <circle class="boba-pearl" cx="38" cy="74" r="5" fill="#1e1b4b"/>
          <circle class="boba-pearl" cx="50" cy="78" r="5.2" fill="#1e1b4b"/>
          <circle class="boba-pearl" cx="62" cy="74" r="5" fill="#1e1b4b"/>
          <circle class="boba-pearl" cx="44" cy="81" r="4.5" fill="#312e81"/>
          <circle class="boba-pearl" cx="57" cy="81" r="4.5" fill="#312e81"/>
          <!-- Cheeks -->
          <circle cx="34" cy="58" r="3.8" fill="#fb7185" opacity="0.55"/>
          <circle cx="66" cy="58" r="3.8" fill="#fb7185" opacity="0.55"/>
        </g>

        <!-- ================= PERSONA 4: GHOST (Spooky Cute / Streetwear) ================= -->
        <g class="persona-ghost">
          <circle cx="50" cy="50" r="42" fill="url(#ghostAuraGrad)" opacity="0.6"/>
          <!-- Little Floating Flame Wisp on top -->
          <path d="M50 20 Q45 14 50 8 Q55 14 50 20 Z" fill="#c084fc" opacity="0.85"/>
          <!-- Wavy Ghost Body -->
          <path d="M26 50 C26 28 74 28 74 50 C74 72 76 80 72 84 C68 87 63 80 58 84 C53 87 47 80 42 84 C37 87 32 80 28 84 C24 81 26 72 26 50 Z" fill="url(#ghostGrad)" stroke="rgba(255,255,255,0.4)" stroke-width="1.4"/>
          <!-- Stubby Floating Ghost Arms -->
          <ellipse cx="21" cy="56" rx="5" ry="3.6" transform="rotate(-18 21 56)" fill="#e0e7ff"/>
          <ellipse cx="79" cy="56" rx="5" ry="3.6" transform="rotate(18 79 56)" fill="#e0e7ff"/>
          <!-- Lavender Cheeks -->
          <ellipse cx="32" cy="56" rx="4.5" ry="2.2" fill="#c084fc" opacity="0.45"/>
          <ellipse cx="68" cy="56" rx="4.5" ry="2.2" fill="#c084fc" opacity="0.45"/>
        </g>

        <!-- ================= PERSONA 5: DRAGON (Baby Mythic Dragon / Anime & Gaming) ================= -->
        <g class="persona-dragon">
          <!-- Wings (Behind Body) -->
          <path d="M24 48 Q8 36 10 58 Q18 56 24 53 Z" fill="#059669" stroke="#047857" stroke-width="1.2"/>
          <path d="M76 48 Q92 36 90 58 Q82 56 76 53 Z" fill="#059669" stroke="#047857" stroke-width="1.2"/>
          <!-- Horns -->
          <polygon points="32,32 20,12 36,22" fill="url(#dragonHornGrad)"/>
          <polygon points="68,32 80,12 64,22" fill="url(#dragonHornGrad)"/>
          <!-- Dragon Sphere Body -->
          <circle cx="50" cy="54" r="33" fill="url(#dragonBodyGrad)"/>
          <!-- Golden Belly Plates -->
          <path d="M38 64 Q50 78 62 64 Q50 84 38 64 Z" fill="#fde68a" opacity="0.95"/>
          <line x1="42" y1="68" x2="58" y2="68" stroke="#d97706" stroke-width="1.2"/>
          <line x1="45" y1="73" x2="55" y2="73" stroke="#d97706" stroke-width="1.2"/>
          <!-- Dragon Snout -->
          <ellipse cx="50" cy="58" rx="6" ry="3.5" fill="#047857" opacity="0.4"/>
          <circle cx="48" cy="58" r="0.9" fill="#064e3b"/>
          <circle cx="52" cy="58" r="0.9" fill="#064e3b"/>
          <!-- Warm Cheeks -->
          <ellipse cx="32" cy="57" rx="4.2" ry="2.4" fill="#f43f5e" opacity="0.4"/>
          <ellipse cx="68" cy="57" rx="4.2" ry="2.4" fill="#f43f5e" opacity="0.4"/>
        </g>

        <!-- ================= SHARED EMOTIVE FACE GROUP ================= -->
        <g class="face-group">
          <!-- IDLE EYES -->
          <g class="eyes-idle">
            <g class="eyelid-blink">
              <circle cx="38" cy="48" r="6.5" fill="#1e293b"/>
              <circle cx="62" cy="48" r="6.5" fill="#1e293b"/>
              <g class="pupils-track">
                <circle cx="38" cy="48" r="5.2" fill="#38bdf8"/>
                <circle cx="38" cy="48" r="2.7" fill="#0f172a"/>
                <circle cx="36.2" cy="46.1" r="1.7" fill="#fff"/>
                <circle cx="39.8" cy="49.8" r="0.8" fill="#fff" opacity="0.8"/>
                <circle cx="62" cy="48" r="5.2" fill="#38bdf8"/>
                <circle cx="62" cy="48" r="2.7" fill="#0f172a"/>
                <circle cx="60.2" cy="46.1" r="1.7" fill="#fff"/>
                <circle cx="63.8" cy="49.8" r="0.8" fill="#fff" opacity="0.8"/>
              </g>
            </g>
            <path d="M45.5 59 Q50 63 54.5 59" fill="none" stroke="#e2e8f0" stroke-width="2.2"/>
          </g>

          <!-- CELEBRATE EYES -->
          <g class="eyes-celebrate">
            <path d="M32 49 Q38 41 44 49" fill="none" stroke="#34d399" stroke-width="3.4"/>
            <path d="M56 49 Q62 41 68 49" fill="none" stroke="#34d399" stroke-width="3.4"/>
            <path d="M43 56 Q50 66 57 56 Z" fill="#f43f5e" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
            <path d="M46 60 Q50 63 54 60" fill="none" stroke="#fda4af" stroke-width="2"/>
          </g>

          <!-- SAD EYES -->
          <g class="eyes-sad">
            <path d="M31 42 Q36 40 42 43" fill="none" stroke="#93c5fd" stroke-width="2.2"/>
            <path d="M69 42 Q64 40 58 43" fill="none" stroke="#93c5fd" stroke-width="2.2"/>
            <circle cx="38" cy="49.5" r="6" fill="#60a5fa"/>
            <circle cx="38" cy="49.5" r="3.2" fill="#1e3a8a"/>
            <circle cx="36.2" cy="47.5" r="2.2" fill="#fff"/>
            <circle cx="40" cy="51.5" r="1.1" fill="#fff"/>
            <circle cx="62" cy="49.5" r="6" fill="#60a5fa"/>
            <circle cx="62" cy="49.5" r="3.2" fill="#1e3a8a"/>
            <circle cx="60.2" cy="47.5" r="2.2" fill="#fff"/>
            <circle cx="64" cy="51.5" r="1.1" fill="#fff"/>
            <path d="M32.5 54 Q38 57 43.5 54" fill="none" stroke="#bae6fd" stroke-width="1.8"/>
            <path d="M56.5 54 Q62 57 67.5 54" fill="none" stroke="#bae6fd" stroke-width="1.8"/>
            <path class="tear-left" d="M33 54 C31.5 57 31.5 59.5 33 60.5 C34.5 59.5 34.5 57 33 54 Z" fill="#38bdf8"/>
            <path class="tear-right" d="M67 54 C65.5 57 65.5 59.5 67 60.5 C68.5 59.5 68.5 57 67 54 Z" fill="#38bdf8"/>
            <path d="M45 61 Q50 56.5 55 61" fill="none" stroke="#cbd5e1" stroke-width="2.2"/>
          </g>

          <!-- NUDGE EYES -->
          <g class="eyes-nudge">
            <path d="M33 40 Q38 37 43 40" fill="none" stroke="#fbbf24" stroke-width="2.4"/>
            <path d="M57 39 Q62 36 67 39" fill="none" stroke="#fbbf24" stroke-width="2.4"/>
            <g class="pupils-track">
              <circle cx="38" cy="48.5" r="5.6" fill="#fbbf24"/>
              <circle cx="38" cy="48.5" r="2.8" fill="#0f172a"/>
              <circle cx="36.2" cy="46.6" r="1.8" fill="#fff"/>
              <circle cx="62" cy="48.5" r="5.6" fill="#fbbf24"/>
              <circle cx="62" cy="48.5" r="2.8" fill="#0f172a"/>
              <circle cx="60.2" cy="46.6" r="1.8" fill="#fff"/>
            </g>
            <path d="M45 59 Q51 63 56 57.5" fill="none" stroke="#fef08a" stroke-width="2.4"/>
          </g>
        </g>
      </g>
    </svg>
  </div>

  <!-- Viral Distribution Badge -->
  <a class="branding-footer" href="https://shopify.com" target="_blank" rel="noopener noreferrer">
    <svg class="branding-bolt" viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 1.5L3 9h4.5l-1 5.5L13 7H8.5l1-5.5z"/></svg>
    <span>Powered by <strong class="brand-name">PulseMascot</strong></span>
  </a>
</div>
`;

  class StoreMascot extends HTMLElement {
    static get observedAttributes() {
      return [
        'show-branding',
        'free-shipping-threshold',
        'tier1-threshold',
        'tier1-reward',
        'tier2-threshold',
        'tier2-reward',
        'tier3-threshold',
        'tier3-reward',
        'persona',
        'enable-sound',
        'enable-exit-intent',
        'exit-discount-code',
        'exit-discount-percent',
        'exit-discount-text',
        'app-name',
        'brand-url',
        'currency-symbol',
        'position',
        'offset-x',
        'offset-y',
        'data-initial-cart-total',
        'data-initial-item-count',
        'enable-ab-test',
        'ab-split',
      ];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._state = STATES.IDLE;
      this._cartTotalDollars = 0;
      this._itemCount = 0;
      this._stateTimer = null;
      this._bubbleTimer = null;
      this._synth = new MascotSynth();
      this._cohort = 'variant_a';
      this._isControlGroup = false;

      // Pupil tracking variables
      this._targetEyeX = 0;
      this._targetEyeY = 0;
      this._currentEyeX = 0;
      this._currentEyeY = 0;
      this._scrollOffsetY = 0;
      this._lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
      this._rafId = null;

      // Confetti physics
      this._particles = [];
      this._confettiRafId = null;

      // Event handlers
      this._onMouseMove = (e) => this._handleMouseMove(e);
      this._onScroll = () => this._handleScroll();
      this._onResize = () => this._handleResize();
      this._onDocOver = (e) => this._handleDocumentMouseOver(e);
      this._onCartEvent = (e) => this._handleCartCustomEvent(e);
      this._onFetch = (u, d) => this._handleFetchIntercepted(u, d);
      this._onBlockSelect = (e) => this._handleBlockSelect(e);
      this._onBlockDeselect = (e) => this._handleBlockDeselect(e);
      this._onWindowMouseLeave = (e) => this._handleExitIntent(e);
      this._onTouch = (e) => this._handleTouch(e);
    }

    connectedCallback() {
      // Singleton guard: Ensure only one mascot element runs on the page
      const allMascots = Array.from(document.querySelectorAll('store-mascot'));
      if (allMascots.length > 1 && allMascots[0] !== this) {
        this.remove();
        return;
      }

      // A/B Testing Cohort Assignment (Variant A: Mascot Visible, Variant B: Control Group Hidden)
      const abAttr = this.getAttribute('enable-ab-test');
      const isAbEnabled = abAttr === 'true' || abAttr === '';
      if (isAbEnabled) {
        const split = parseFloat(this.getAttribute('ab-split')) || 50;
        let assigned = null;
        try {
          assigned = sessionStorage.getItem('__pulseMascotCohort__');
          if (!assigned) {
            assigned = (Math.random() * 100 < split) ? 'variant_a' : 'variant_b';
            sessionStorage.setItem('__pulseMascotCohort__', assigned);
          }
        } catch (_) {
          assigned = 'variant_a';
        }
        this._cohort = assigned;
      } else {
        this._cohort = 'variant_a';
      }

      if (this._cohort === 'variant_b') {
        // Control Cohort: completely hide mascot from customer, but observe conversions silently
        this.style.display = 'none';
        this._isControlGroup = true;
        ['cart:updated', 'cart:refresh'].forEach((evt) => {
          window.addEventListener(evt, this._onCartEvent);
          document.addEventListener(evt, this._onCartEvent);
        });
        this._unsubFetch = ensureFetchInterceptor().subscribe(this._onFetch);
        this._hydrateFromLiquid();
        this._sendTelemetry('impression', { cohort: 'variant_b', control: true });
        return;
      }

      this._render();
      this._syncAttributes();
      this.setAttribute('data-state', this._state);

      window.addEventListener('mousemove', this._onMouseMove, { passive: true });
      window.addEventListener('touchmove', this._onTouch, { passive: true });
      window.addEventListener('touchstart', this._onTouch, { passive: true });
      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onResize, { passive: true });
      document.addEventListener('mouseover', this._onDocOver, { passive: true });
      document.addEventListener('mouseleave', this._onWindowMouseLeave, { passive: true });

      ['cart:updated', 'cart:refresh'].forEach((evt) => {
        window.addEventListener(evt, this._onCartEvent);
        document.addEventListener(evt, this._onCartEvent);
      });

      document.addEventListener('shopify:block:select', this._onBlockSelect);
      document.addEventListener('shopify:block:deselect', this._onBlockDeselect);

      this._unsubFetch = ensureFetchInterceptor().subscribe(this._onFetch);

      this._handleResize();
      this._startTrackingLoop();
      this._hydrateFromLiquid();

      // Record impressions
      MascotAnalytics.record('impressions', 1);
      this._sendTelemetry('impression', { cohort: 'variant_a' });
    }

    disconnectedCallback() {
      window.removeEventListener('mousemove', this._onMouseMove);
      window.removeEventListener('touchmove', this._onTouch);
      window.removeEventListener('touchstart', this._onTouch);
      window.removeEventListener('scroll', this._onScroll);
      window.removeEventListener('resize', this._onResize);
      document.removeEventListener('mouseover', this._onDocOver);
      document.removeEventListener('mouseleave', this._onWindowMouseLeave);

      ['cart:updated', 'cart:refresh'].forEach((evt) => {
        window.removeEventListener(evt, this._onCartEvent);
        document.removeEventListener(evt, this._onCartEvent);
      });

      document.removeEventListener('shopify:block:select', this._onBlockSelect);
      document.removeEventListener('shopify:block:deselect', this._onBlockDeselect);

      if (this._unsubFetch) this._unsubFetch();
      if (this._rafId) cancelAnimationFrame(this._rafId);
      if (this._confettiRafId) cancelAnimationFrame(this._confettiRafId);
      if (this._stateTimer) clearTimeout(this._stateTimer);
      if (this._bubbleTimer) clearTimeout(this._bubbleTimer);
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (!this._isRendered || oldVal === newVal) return;
      this._syncAttributes();
      if (
        name.includes('threshold') ||
        name === 'currency-symbol' ||
        name === 'persona'
      ) {
        if (this._itemCount > 0 || this._bubbleEl.classList.contains('visible')) {
          this._renderHydratedCartState(false);
        }
      }
    }

    // --- Configuration Getters ---
    get tier1Threshold() {
      const v = parseFloat(this.getAttribute('tier1-threshold') || this.getAttribute('free-shipping-threshold'));
      return Number.isFinite(v) && v > 0 ? v : 50;
    }
    get freeShippingThreshold() { return this.tier1Threshold; }
    get tier1Reward() { return this.getAttribute('tier1-reward') || 'Free Shipping'; }

    get tier2Threshold() {
      const v = parseFloat(this.getAttribute('tier2-threshold'));
      return Number.isFinite(v) && v > this.tier1Threshold ? v : 0;
    }
    get tier2Reward() { return this.getAttribute('tier2-reward') || 'Mystery Gift 🎁'; }

    get tier3Threshold() {
      const v = parseFloat(this.getAttribute('tier3-threshold'));
      const min = this.tier2Threshold > 0 ? this.tier2Threshold : this.tier1Threshold;
      return Number.isFinite(v) && v > min ? v : 0;
    }
    get tier3Reward() { return this.getAttribute('tier3-reward') || 'VIP 15% OFF 👑'; }

    get currencySymbol() { return this.getAttribute('currency-symbol') || '$'; }
    get persona() {
      const p = (this.getAttribute('persona') || 'orb').toLowerCase();
      return PERSONAS[p.toUpperCase()] || 'orb';
    }
    get enableSound() {
      const s = this.getAttribute('enable-sound');
      return s === null ? true : String(s).toLowerCase() !== 'false';
    }
    get enableExitIntent() {
      const e = this.getAttribute('enable-exit-intent');
      return e === null ? true : String(e).toLowerCase() !== 'false';
    }
    get exitDiscountCode() { return this.getAttribute('exit-discount-code') || 'SAVE10'; }
    get exitDiscountPercent() { return this.getAttribute('exit-discount-percent') || '10%'; }
    get exitDiscountText() {
      return this.getAttribute('exit-discount-text') || `Wait! Don't leave empty-handed 🥺 Take ${this.exitDiscountPercent} OFF!`;
    }

    get appName() { return this.getAttribute('app-name') || 'PulseMascot'; }
    get brandUrl() { return this.getAttribute('brand-url') || 'https://shopify.com'; }
    get showBranding() {
      const a = this.getAttribute('show-branding');
      return a === null ? true : String(a).toLowerCase() !== 'false';
    }
    get position() {
      const p = String(this.getAttribute('position') || 'bottom-right').toLowerCase();
      return p === 'bottom-left' ? 'bottom-left' : 'bottom-right';
    }
    get offsetX() {
      const x = parseFloat(this.getAttribute('offset-x'));
      return Number.isFinite(x) ? Math.min(100, Math.max(10, x)) : 24;
    }
    get offsetY() {
      const y = parseFloat(this.getAttribute('offset-y'));
      return Number.isFinite(y) ? Math.min(100, Math.max(10, y)) : 24;
    }
    get state() { return this._state; }

    // Public method to retrieve analytics
    getAnalytics() {
      return MascotAnalytics.get();
    }
    resetAnalytics() {
      MascotAnalytics.reset();
    }

    // --- Hydration ---
    _hydrateFromLiquid() {
      const rawTotal = parseFloat(this.getAttribute('data-initial-cart-total'));
      const rawCount = parseInt(this.getAttribute('data-initial-item-count'), 10);
      if (Number.isFinite(rawTotal) && rawTotal >= 0) this._cartTotalDollars = rawTotal;
      if (Number.isFinite(rawCount) && rawCount >= 0) this._itemCount = rawCount;

      if (this._itemCount > 0) {
        this._renderHydratedCartState(true);
      }
    }

    _renderHydratedCartState(allowConfetti = false) {
      const status = this._calculateTierStatus();
      if (status.isAllUnlocked) {
        this.setState(STATES.CELEBRATE, {
          message: `All Rewards Unlocked! You're a VIP! 👑🎉`,
          badge: 'VIP Status Unlocked',
          confetti: allowConfetti,
          sound: allowConfetti,
          showMeter: true,
        });
      } else if (status.currentTierAchieved > 0) {
        this.setState(STATES.CELEBRATE, {
          message: `${status.lastUnlockedReward} Unlocked! 🎉 Add ${this.currencySymbol}${this._formatAmount(status.remainingToNext)} for ${status.nextReward}!`,
          badge: 'Reward Unlocked',
          confetti: allowConfetti,
          sound: allowConfetti,
          showMeter: true,
        });
      } else {
        this.nudge(`Add ${this.currencySymbol}${this._formatAmount(status.remainingToNext)} more for ${status.nextReward}!`, {
          badge: status.remainingToNext <= this.tier1Threshold * 0.4 ? 'Almost There!' : 'Shopping Goal',
          showMeter: true,
        });
      }
    }

    _calculateTierStatus() {
      const total = this._cartTotalDollars;
      const t1 = this.tier1Threshold;
      const t2 = this.tier2Threshold;
      const t3 = this.tier3Threshold;

      if (t3 > 0 && total >= t3) {
        return { isAllUnlocked: true, currentTierAchieved: 3, lastUnlockedReward: this.tier3Reward, nextReward: '', remainingToNext: 0, progressPct: 100 };
      }
      if (t3 > 0 && total >= t2 && t2 > 0) {
        const rem = t3 - total;
        const span = t3 - t2;
        return { isAllUnlocked: false, currentTierAchieved: 2, lastUnlockedReward: this.tier2Reward, nextReward: this.tier3Reward, remainingToNext: rem, progressPct: Math.min(100, ((total - t2) / span) * 100) };
      }
      if (t2 > 0 && total >= t1) {
        const rem = t2 - total;
        const span = t2 - t1;
        return { isAllUnlocked: false, currentTierAchieved: 1, lastUnlockedReward: this.tier1Reward, nextReward: this.tier2Reward, remainingToNext: rem, progressPct: Math.min(100, ((total - t1) / span) * 100) };
      }
      if (total >= t1 && t2 === 0) {
        return { isAllUnlocked: true, currentTierAchieved: 1, lastUnlockedReward: this.tier1Reward, nextReward: '', remainingToNext: 0, progressPct: 100 };
      }

      // Progress towards Tier 1
      const rem = Math.max(0, t1 - total);
      return {
        isAllUnlocked: false,
        currentTierAchieved: 0,
        lastUnlockedReward: '',
        nextReward: this.tier1Reward,
        remainingToNext: rem,
        progressPct: Math.min(100, Math.max(0, (total / t1) * 100)),
      };
    }

    _handleBlockSelect(e) {
      if (!this._matchesBlockEvent(e)) return;
      this.setAttribute('data-editor-selected', 'true');
      this._syncAttributes();
      this.nudge(this._getShippingMessage(), {
        badge: 'Theme Editor Preview',
        duration: 0,
        showMeter: true,
      });
    }

    _handleBlockDeselect(e) {
      if (!this._matchesBlockEvent(e)) return;
      this.removeAttribute('data-editor-selected');
      this._syncAttributes();
      this.setIdle({ hideBubble: true });
    }

    _matchesBlockEvent(e) {
      const blockId = this.getAttribute('data-shopify-block-id');
      const evtBlockId = e && e.detail && e.detail.blockId;
      if (blockId && evtBlockId) return String(blockId) === String(evtBlockId);
      return Boolean(e && (e.target === this || (e.target && e.target.contains && e.target.contains(this))));
    }

    // --- State Machine ---
    setState(nextState, options = {}) {
      const norm = String(nextState || '').toUpperCase();
      if (!STATES[norm]) return;

      if (this._stateTimer) {
        clearTimeout(this._stateTimer);
        this._stateTimer = null;
      }

      this._state = norm;
      this.setAttribute('data-state', norm);
      this._updateBodyGradient(norm);

      const {
        message,
        badge,
        duration = norm === STATES.IDLE ? 0 : 5000,
        confetti = norm === STATES.CELEBRATE,
        sound = true,
        showMeter = false,
        isExitOffer = false,
      } = options;

      if (confetti) this.launchConfetti();
      if (sound && this.enableSound) {
        if (norm === STATES.CELEBRATE) this._synth.play('celebrate');
        else if (norm === STATES.SAD) this._synth.play('sad');
        else if (norm === STATES.NUDGE) this._synth.play('pop');
      }

      if (message) {
        this.showSpeechBubble(message, {
          tone: isExitOffer ? 'exit' : norm.toLowerCase(),
          badge: badge || this._defaultBadge(norm),
          showMeter,
          isExitOffer,
          autoHideMs: duration > 0 ? duration + 1500 : 0,
        });
      } else if (norm === STATES.IDLE && options.hideBubble) {
        this.hideSpeechBubble();
      }

      if (duration > 0 && norm !== STATES.IDLE) {
        this._stateTimer = setTimeout(() => this.setIdle(), duration);
      }

      this.dispatchEvent(
        new CustomEvent('mascot:statechange', {
          detail: { state: norm, cartTotal: this._cartTotalDollars, itemCount: this._itemCount },
          bubbles: true,
          composed: true,
        })
      );
    }

    setIdle(opts = {}) { this.setState(STATES.IDLE, opts); }
    celebrate(msg, opts = {}) {
      MascotAnalytics.record('milestonesReached', 1);
      this.setState(STATES.CELEBRATE, {
        message: msg || `${this.tier1Reward} Unlocked! 🎉`,
        confetti: true,
        showMeter: true,
        ...opts,
      });
    }
    sad(msg = 'Aww, item removed from your cart.', opts = {}) {
      this.setState(STATES.SAD, { message: msg, confetti: false, showMeter: true, ...opts });
    }
    nudge(msg, opts = {}) {
      this.setState(STATES.NUDGE, {
        message: msg || this._getShippingMessage(),
        confetti: false,
        showMeter: true,
        ...opts,
      });
    }

    showSpeechBubble(message, opts = {}) {
      if (!this._bubbleEl) return;
      if (this._bubbleTimer) {
        clearTimeout(this._bubbleTimer);
        this._bubbleTimer = null;
      }

      this._bubbleEl.setAttribute('data-tone', opts.tone || this._state.toLowerCase());
      this._badgeEl.textContent = opts.badge || this._defaultBadge(this._state);
      this._messageEl.textContent = message;

      // Handle meter and milestone labels
      if (opts.showMeter) {
        this._meterEl.classList.remove('hidden');
        const status = this._calculateTierStatus();
        this._meterFillEl.style.width = `${status.progressPct.toFixed(1)}%`;

        // Update tier markers
        if (this._tier1Tag) {
          this._tier1Tag.textContent = this.tier1Reward;
          this._tier1Tag.classList.toggle('reached', this._cartTotalDollars >= this.tier1Threshold);
        }
        if (this._tier2Tag) {
          if (this.tier2Threshold > 0) {
            this._tier2Tag.style.display = 'inline';
            this._tier2Tag.textContent = this.tier2Reward;
            this._tier2Tag.classList.toggle('reached', this._cartTotalDollars >= this.tier2Threshold);
          } else {
            this._tier2Tag.style.display = 'none';
          }
        }
        if (this._tier3Tag) {
          if (this.tier3Threshold > 0) {
            this._tier3Tag.style.display = 'inline';
            this._tier3Tag.textContent = this.tier3Reward;
            this._tier3Tag.classList.toggle('reached', this._cartTotalDollars >= this.tier3Threshold);
          } else {
            this._tier3Tag.style.display = 'none';
          }
        }
      } else {
        this._meterEl.classList.add('hidden');
      }

      // Exit-intent CTA button
      if (opts.isExitOffer) {
        this._exitCtaContainer.classList.add('visible');
        this._exitCtaBtn.textContent = `Apply ${this.exitDiscountCode} & Checkout →`;
        this._exitCtaBtn.setAttribute('href', `/discount/${encodeURIComponent(this.exitDiscountCode)}?redirect=/checkout`);
      } else {
        this._exitCtaContainer.classList.remove('visible');
      }

      this._bubbleEl.classList.add('visible');

      if (opts.autoHideMs > 0 && !opts.isExitOffer) {
        this._bubbleTimer = setTimeout(() => this.hideSpeechBubble(), opts.autoHideMs);
      }
    }

    hideSpeechBubble() {
      if (this._bubbleEl) this._bubbleEl.classList.remove('visible');
    }

    // --- Cart Mutations & Multi-tier Calculations ---
    processCartUpdate(payload = {}, actionType = 'refresh') {
      const prevTotal = this._cartTotalDollars;
      const prevCount = this._itemCount;

      this._cartTotalDollars = Math.max(0, this._extractTotal(payload, actionType, prevTotal));
      this._itemCount = Math.max(0, this._extractCount(payload, actionType, prevCount));

      if (this._isControlGroup) {
        if (this._cartTotalDollars > prevTotal) {
          this._sendTelemetry('cart_activity', { cohort: 'variant_b', cartTotal: this._cartTotalDollars });
        }
        return;
      }

      const status = this._calculateTierStatus();
      const isRemoval =
        actionType === 'clear' ||
        this._cartTotalDollars < prevTotal - 0.005 ||
        (actionType === 'change' && (this._itemCount < prevCount || this._cartTotalDollars <= prevTotal));

      if (isRemoval) {
        const msg = status.isAllUnlocked
          ? 'All VIP Rewards Unlocked! 👑'
          : `Add ${this.currencySymbol}${this._formatAmount(status.remainingToNext)} more for ${status.nextReward}!`;
        this.sad(msg, { badge: 'Item Removed', showMeter: true });
        return;
      }

      if (status.isAllUnlocked && prevTotal < (this.tier3Threshold || this.tier1Threshold)) {
        const reward = this.tier3Reward || this.tier1Reward;
        this.celebrate(`All Rewards Unlocked! You're a VIP! 👑🎉`, { badge: 'Top Tier VIP', showMeter: true });
        this.dispatchEvent(new CustomEvent('mascot:milestone_reached', { detail: { tier: 'VIP', reward } }));
        this._sendTelemetry('milestone', { label: `VIP Unlocked (${reward})`, revenue: this._cartTotalDollars });
        this._firePixelEvent('MascotMilestoneReached', { tier: 'VIP', reward, value: this._cartTotalDollars, currency: 'USD' });
      } else if (status.currentTierAchieved > 0 && this._cartTotalDollars >= prevTotal) {
        this.celebrate(`${status.lastUnlockedReward} Unlocked! 🎉`, { badge: 'Milestone Reached', showMeter: true });
        this.dispatchEvent(new CustomEvent('mascot:milestone_reached', { detail: { tier: status.currentTierAchieved, reward: status.lastUnlockedReward } }));
        this._sendTelemetry('milestone', { label: `${status.lastUnlockedReward} Unlocked`, revenue: this._cartTotalDollars });
        this._firePixelEvent('MascotMilestoneReached', { tier: status.currentTierAchieved, reward: status.lastUnlockedReward, value: this._cartTotalDollars, currency: 'USD' });
      } else if (actionType === 'add') {
        this.celebrate(`Add ${this.currencySymbol}${this._formatAmount(status.remainingToNext)} more for ${status.nextReward}!`, {
          badge: 'Added to Cart',
          showMeter: true,
        });
      } else {
        this.nudge(`Add ${this.currencySymbol}${this._formatAmount(status.remainingToNext)} more for ${status.nextReward}!`, {
          badge: status.remainingToNext <= this.tier1Threshold * 0.4 ? 'Almost There!' : 'Shopping Goal',
          showMeter: true,
        });
      }
    }

    _extractTotal(p, action, prev) {
      if (action === 'clear') return 0;
      if (!p || typeof p !== 'object') return prev;
      if (typeof p.total_price_dollars === 'number') return p.total_price_dollars;
      if (typeof p.total_price === 'number') return this._scaleCents(p.total_price, p);
      if (typeof p.items_subtotal_price === 'number') return this._scaleCents(p.items_subtotal_price, p);
      if (typeof p.final_line_price === 'number') return prev + this._scaleCents(p.final_line_price, p);
      if (typeof p.line_price === 'number') return prev + this._scaleCents(p.line_price, p);
      if (typeof p.price === 'number') return prev + this._scaleCents(p.price * (p.quantity || 1), p);
      if (Array.isArray(p.items)) {
        const sum = p.items.reduce(
          (a, i) => a + (typeof i.final_line_price === 'number' ? i.final_line_price : (i.price || 0) * (i.quantity || 1)),
          0
        );
        return this._scaleCents(sum, p);
      }
      return prev;
    }

    _extractCount(p, action, prev) {
      if (action === 'clear') return 0;
      if (!p || typeof p !== 'object') return prev;
      if (typeof p.item_count === 'number') return p.item_count;
      if (Array.isArray(p.items)) return p.items.reduce((s, i) => s + (i.quantity || 1), 0);
      return action === 'add' ? prev + (p.quantity || 1) : prev;
    }

    _scaleCents(val, p) {
      if (p && p.currency_unit === 'dollars') return val;
      if (!Number.isInteger(val)) return val;
      return val / 100;
    }

    _formatAmount(n) {
      const r = Math.round(n * 100) / 100;
      return Number.isInteger(r) ? String(r) : r.toFixed(2);
    }

    _getShippingMessage() {
      const status = this._calculateTierStatus();
      return status.isAllUnlocked
        ? `All Rewards Unlocked! 👑🎉`
        : `Add ${this.currencySymbol}${this._formatAmount(status.remainingToNext)} more for ${status.nextReward}!`;
    }

    _handleFetchIntercepted(url, data) {
      let action = 'refresh';
      if (/\/cart\/add/i.test(url)) action = 'add';
      else if (/\/cart\/(change|update)/i.test(url)) action = 'change';
      else if (/\/cart\/clear/i.test(url)) action = 'clear';
      this.processCartUpdate(data, action);
    }

    _handleCartCustomEvent(e) {
      const d = (e && e.detail) || {};
      this.processCartUpdate(d.cart || d, d.action || 'refresh');
    }

    // --- Interactive Tracking & Exit Intent ---
    _handleMouseMove(e) {
      // Exit intent detection on rapid upward movement near window boundary
      if (this.enableExitIntent && this._itemCount > 0 && e.clientY <= 14 && e.movementY < 0) {
        this._triggerExitIntentOffer();
      }

      if (!this._stageEl) return;
      const r = this._stageEl.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, dist / 260) * 4.2;
      this._targetEyeX = (dx / dist) * f;
      this._targetEyeY = (dy / dist) * f;
    }

    _handleTouch(e) {
      if (!e.touches || !e.touches[0] || !this._stageEl) return;
      const touch = e.touches[0];
      const r = this._stageEl.getBoundingClientRect();
      const dx = touch.clientX - (r.left + r.width / 2);
      const dy = touch.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, dist / 260) * 4.2;
      this._targetEyeX = (dx / dist) * f;
      this._targetEyeY = (dy / dist) * f;
    }

    _handleExitIntent(e) {
      if (this.enableExitIntent && this._itemCount > 0 && (!e.relatedTarget || e.clientY <= 0)) {
        this._triggerExitIntentOffer();
      }
    }

    _triggerExitIntentOffer() {
      try {
        if (sessionStorage.getItem(SESSION_EXIT_KEY)) return;
        sessionStorage.setItem(SESSION_EXIT_KEY, '1');
      } catch (_) {}

      MascotAnalytics.record('exitOffersShown', 1);

      this._firePixelEvent('MascotExitOfferSeen', {
        code: this.exitDiscountCode,
        value: this._cartTotalDollars,
        currency: 'USD'
      });

      this.setState(STATES.SAD, {
        message: this.exitDiscountText,
        badge: 'Special Gift 🎁',
        isExitOffer: true,
        duration: 0,
        showMeter: false,
      });

      this.dispatchEvent(new CustomEvent('mascot:exit_intent_shown', {
        detail: { code: this.exitDiscountCode, cartTotal: this._cartTotalDollars }
      }));
    }

    _handleScroll() {
      const y = window.scrollY || window.pageYOffset || 0;
      this._scrollOffsetY = Math.max(-4.5, Math.min(4.5, this._scrollOffsetY + (y - this._lastScrollY) * 0.08));
      this._lastScrollY = y;
    }

    _handleDocumentMouseOver(e) {
      const t = e.target;
      if (
        t &&
        typeof t.closest === 'function' &&
        t.closest('[name="checkout"], .checkout-btn, [href*="/checkout"], [data-mascot-checkout]') &&
        this._state !== STATES.CELEBRATE
      ) {
        this.nudge(this._getShippingMessage(), { badge: 'Checkout Nudge', duration: 4200 });
      }
    }

    _startTrackingLoop() {
      const step = () => {
        this._currentEyeX += (this._targetEyeX - this._currentEyeX) * 0.16;
        this._currentEyeY += (this._targetEyeY + this._scrollOffsetY - this._currentEyeY) * 0.16;
        this._scrollOffsetY *= 0.88;

        if (this._pupilGroups && this._faceGroup) {
          const px = this._currentEyeX.toFixed(2);
          const py = this._currentEyeY.toFixed(2);
          const fx = (this._currentEyeX * 0.45).toFixed(2);
          const fy = (this._currentEyeY * 0.45).toFixed(2);
          for (let i = 0; i < this._pupilGroups.length; i++) {
            this._pupilGroups[i].setAttribute('transform', `translate(${px}, ${py})`);
          }
          this._faceGroup.setAttribute('transform', `translate(${fx}, ${fy})`);
        }
        this._rafId = requestAnimationFrame(step);
      };
      this._rafId = requestAnimationFrame(step);
    }

    _handleResize() {
      if (!this._canvasEl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this._canvasEl.width = window.innerWidth * dpr;
      this._canvasEl.height = window.innerHeight * dpr;
      this._dpr = dpr;
    }

    // --- Embedded Confetti Engine ---
    launchConfetti() {
      if (!this._canvasEl || !this._stageEl) return;
      this._handleResize();
      const r = this._stageEl.getBoundingClientRect();
      const ox = r.left + r.width / 2;
      const oy = r.top + r.height / 3;
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#38bdf8', '#a855f7', '#fde047'];
      const shapes = ['rect', 'circle', 'star'];

      for (let i = 0; i < 76; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.58) * 1.45;
        const s = 6.5 + Math.random() * 11.5;
        this._particles.push({
          x: ox,
          y: oy,
          vx: Math.cos(a) * s + (Math.random() - 0.5) * 2.5,
          vy: Math.sin(a) * s - Math.random() * 3,
          size: 5 + Math.random() * 5.5,
          color: colors[i % colors.length],
          shape: shapes[i % shapes.length],
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.24,
          wobble: Math.random() * 10,
          wSpeed: 0.08 + Math.random() * 0.08,
          opacity: 1,
          decay: 0.011 + Math.random() * 0.009,
        });
      }
      if (!this._confettiRafId) this._runConfettiLoop();
    }

    _runConfettiLoop() {
      const ctx = this._canvasEl.getContext('2d');
      const dpr = this._dpr || 1;
      const frame = () => {
        ctx.clearRect(0, 0, this._canvasEl.width, this._canvasEl.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        for (let i = this._particles.length - 1; i >= 0; i--) {
          const p = this._particles[i];
          p.x += p.vx + Math.sin(p.wobble) * 0.9;
          p.y += p.vy;
          p.vy += 0.32;
          p.vx *= 0.985;
          p.rot += p.vRot;
          p.wobble += p.wSpeed;
          p.opacity -= p.decay;
          if (p.opacity <= 0 || p.y > window.innerHeight + 40) {
            this._particles.splice(i, 1);
            continue;
          }
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'star') {
            this._drawStar(ctx, p.size * 0.65);
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
          }
          ctx.restore();
        }
        ctx.restore();
        if (this._particles.length > 0) {
          this._confettiRafId = requestAnimationFrame(frame);
        } else {
          ctx.clearRect(0, 0, this._canvasEl.width, this._canvasEl.height);
          this._confettiRafId = null;
        }
      };
      this._confettiRafId = requestAnimationFrame(frame);
    }

    _drawStar(ctx, r) {
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        const m = a + Math.PI / 4;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(m) * (r * 0.38), Math.sin(m) * (r * 0.38));
      }
      ctx.closePath();
      ctx.fill();
    }

    _render() {
      const style = document.createElement('style');
      style.textContent = STYLES;
      const tpl = document.createElement('div');
      tpl.innerHTML = HTML;

      this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(style);
      while (tpl.firstChild) this.shadowRoot.appendChild(tpl.firstChild);

      const q = (s) => this.shadowRoot.querySelector(s);
      this._canvasEl = q('.confetti-canvas');
      this._bubbleEl = q('.speech-bubble');
      this._badgeEl = q('.bubble-badge');
      this._messageEl = q('.bubble-message');
      this._closeBtn = q('.bubble-close');
      this._meterEl = q('.shipping-meter');
      this._meterFillEl = q('.shipping-meter-fill');
      this._tier1Tag = q('.tier-1-tag');
      this._tier2Tag = q('.tier-2-tag');
      this._tier3Tag = q('.tier-3-tag');
      this._exitCtaContainer = q('.exit-cta-container');
      this._exitCtaBtn = q('.exit-cta-btn');
      this._stageEl = q('.mascot-stage');
      this._orbBodyEl = q('.orb-body-base');
      this._faceGroup = q('.face-group');
      this._pupilGroups = this.shadowRoot.querySelectorAll('.pupils-track');
      this._brandingEl = q('.branding-footer');
      this._brandNameEl = q('.brand-name');

      this._closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideSpeechBubble();
      });

      this._exitCtaBtn.addEventListener('click', () => {
        this._firePixelEvent('MascotDiscountClaimed', {
          code: this.exitDiscountCode,
          value: this._cartTotalDollars,
          currency: 'USD'
        });
        MascotAnalytics.record('exitOffersConverted', 1);
        MascotAnalytics.record('attributedRevenue', this._cartTotalDollars);
        this._sendTelemetry('exit_intent', { code: this.exitDiscountCode, revenue: this._cartTotalDollars });
        this.dispatchEvent(new CustomEvent('mascot:exit_intent_converted', {
          detail: { code: this.exitDiscountCode, cartTotal: this._cartTotalDollars }
        }));
      });

      this._stageEl.addEventListener('click', () => {
        MascotAnalytics.record('interactions', 1);
        this._sendTelemetry('interaction');
        const status = this._calculateTierStatus();
        if (status.isAllUnlocked) this.celebrate(`All Rewards Unlocked! You're a VIP! 👑🎉`);
        else this.nudge(this._getShippingMessage());
      });

      this._stageEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._stageEl.click();
        }
      });

      this._isRendered = true;
    }

    _firePixelEvent(eventName, payload = {}) {
      try {
        if (typeof window.fbq === 'function') {
          window.fbq('trackCustom', eventName, payload);
        }
        if (window.ttq && typeof window.ttq.track === 'function') {
          window.ttq.track(eventName, payload);
        }
        if (typeof window.gtag === 'function') {
          window.gtag('event', eventName, payload);
        }
      } catch (_) {}
    }

    _syncAttributes() {
      this.style.setProperty('--mascot-offset-x', `${this.offsetX}px`);
      this.style.setProperty('--mascot-offset-y', `${this.offsetY}px`);
      this.setAttribute('persona', this.persona);

      const p = this.persona;
      const orb = this.shadowRoot && this.shadowRoot.querySelector('.persona-orb');
      const pet = this.shadowRoot && this.shadowRoot.querySelector('.persona-pet');
      const boba = this.shadowRoot && this.shadowRoot.querySelector('.persona-boba');
      const ghost = this.shadowRoot && this.shadowRoot.querySelector('.persona-ghost');
      const dragon = this.shadowRoot && this.shadowRoot.querySelector('.persona-dragon');
      if (orb) orb.style.display = (p === 'orb') ? '' : 'none';
      if (pet) pet.style.display = (p === 'pet') ? '' : 'none';
      if (boba) boba.style.display = (p === 'boba') ? '' : 'none';
      if (ghost) ghost.style.display = (p === 'ghost') ? '' : 'none';
      if (dragon) dragon.style.display = (p === 'dragon') ? '' : 'none';

      if (!this._brandingEl || !this._brandNameEl) return;
      this._brandNameEl.textContent = this.appName;
      this._brandingEl.setAttribute('href', this.brandUrl);
      this._brandingEl.classList.toggle('hidden', !this.showBranding);
    }

    _updateBodyGradient(state) {
      if (!this._orbBodyEl) return;
      const map = {
        IDLE: 'url(#orbGradIdle)',
        CELEBRATE: 'url(#orbGradCelebrate)',
        SAD: 'url(#orbGradSad)',
        NUDGE: 'url(#orbGradNudge)',
      };
      this._orbBodyEl.setAttribute('fill', map[state] || map.IDLE);
    }

    _defaultBadge(state) {
      if (state === STATES.CELEBRATE) return 'Milestone Goal';
      if (state === STATES.SAD) return 'Cart Update';
      if (state === STATES.NUDGE) return 'Friendly Nudge';
      return 'Store Companion';
    }

    _sendTelemetry(type, payload = {}) {
      try {
        const body = JSON.stringify({
          type,
          cohort: this._cohort || 'variant_a',
          shop: (typeof window !== 'undefined' && window.Shopify && window.Shopify.shop) || 'demo-store.myshopify.com',
          timestamp: Date.now(),
          ...payload,
        });
        const endpoints = ['/apps/pulse-mascot/telemetry', '/api/telemetry'];
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(endpoints[0], body);
        } else if (typeof window !== 'undefined' && window.fetch) {
          window.fetch(endpoints[1], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      } catch (_) {}
    }
  }

  if (!customElements.get('store-mascot')) {
    customElements.define('store-mascot', StoreMascot);
  }
})();