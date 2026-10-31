/**
 * Bored AI Web — Wobbly Shopping Cart 🛒⚡
 * Pure Vanilla JS + HTML5 Canvas + Web Audio API (Zero Dependencies)
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIS ENGINE (Web Audio API) ---
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.initialized = false;
      this.rumbleGain = null;
      this.rumbleFilter = null;
      this.squeakGain = null;
      this.squeakOsc = null;
      this.squeakMod = null;
      this.squeakModGain = null;
      this.noiseBuffer = null;
    }

    init() {
      if (this.initialized) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.setupContinuousSounds();
      this.initialized = true;

      const prompt = document.getElementById('audio-prompt-banner');
      if (prompt) prompt.classList.add('hidden');
    }

    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted && this.ctx) {
        if (this.rumbleGain) this.rumbleGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.squeakGain) this.squeakGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      return !this.isMuted;
    }

    createNoiseBuffer() {
      if (!this.ctx) return null;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink/Brownish noise approximation
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
      return buffer;
    }

    setupContinuousSounds() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Asphalt Rolling Rumble (Filtered Noise)
      this.noiseBuffer = this.createNoiseBuffer();
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      noiseSource.loop = true;

      this.rumbleFilter = this.ctx.createBiquadFilter();
      this.rumbleFilter.type = 'lowpass';
      this.rumbleFilter.frequency.setValueAtTime(140, t);

      this.rumbleGain = this.ctx.createGain();
      this.rumbleGain.gain.setValueAtTime(0, t);

      noiseSource.connect(this.rumbleFilter);
      this.rumbleFilter.connect(this.rumbleGain);
      this.rumbleGain.connect(this.ctx.destination);
      noiseSource.start(0);

      // 2. High-Pitched Defective Caster Squeak (FM Synthesis)
      this.squeakOsc = this.ctx.createOscillator();
      this.squeakOsc.type = 'triangle';
      this.squeakOsc.frequency.setValueAtTime(2200, t);

      this.squeakMod = this.ctx.createOscillator();
      this.squeakMod.type = 'sawtooth';
      this.squeakMod.frequency.setValueAtTime(35, t);

      this.squeakModGain = this.ctx.createGain();
      this.squeakModGain.gain.setValueAtTime(600, t);

      this.squeakMod.connect(this.squeakOsc.frequency);

      this.squeakGain = this.ctx.createGain();
      this.squeakGain.gain.setValueAtTime(0, t);

      this.squeakOsc.connect(this.squeakGain);
      this.squeakGain.connect(this.ctx.destination);

      this.squeakOsc.start(0);
      this.squeakMod.start(0);
    }

    updateContinuousSounds(speed, rpm) {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;

      // Rumble volume & cutoff based on speed
      const normSpeed = Math.min(speed / 18, 1);
      const rumbleVol = normSpeed * 0.22;
      const rumbleFreq = 100 + normSpeed * 350;
      this.rumbleGain.gain.setTargetAtTime(rumbleVol, t, 0.05);
      this.rumbleFilter.frequency.setTargetAtTime(rumbleFreq, t, 0.05);

      // Defective squeak volume & pitch based on RPM
      const normRpm = Math.max(0, (rpm - 600) / 4500);
      const squeakVol = (normRpm > 0.05 ? 0.03 + normRpm * 0.16 : 0) * (normSpeed > 0.02 ? 1 : 0.2);
      const carrierFreq = 1800 + normRpm * 900;
      const modFreq = 20 + normRpm * 65;

      this.squeakGain.gain.setTargetAtTime(squeakVol, t, 0.04);
      this.squeakOsc.frequency.setTargetAtTime(carrierFreq, t, 0.04);
      this.squeakMod.frequency.setTargetAtTime(modFreq, t, 0.04);
    }

    playDingBell() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;

      const freqs = [1760, 2637]; // A6 & E7 double ring
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.25, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.65);
      });
    }

    playKickSound(superMode = false) {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;

      // Heavy foot stomp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);

      // Metal clang
      const clang = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      clang.type = superMode ? 'sawtooth' : 'square';
      clang.frequency.setValueAtTime(superMode ? 1400 : 880, t);
      clang.frequency.exponentialRampToValueAtTime(320, t + 0.35);

      cGain.gain.setValueAtTime(0.35, t);
      cGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      clang.connect(cGain);
      cGain.connect(this.ctx.destination);
      clang.start(t);
      clang.stop(t + 0.38);
    }

    playClatter() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      // Grocery clattering / wire basket rattling
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 900, t + i * 0.03);
        gain.gain.setValueAtTime(0.12, t + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.03);
        osc.stop(t + i * 0.03 + 0.15);
      }
    }

    playSpeedBump() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.28);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
      this.playClatter();
    }

    playPigeonPanic() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      // High pitch frantic coo/chirp
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(1400, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.16);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }

    playCarAlarm() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(i % 2 === 0 ? 880 : 1200, t + i * 0.15);
        gain.gain.setValueAtTime(0.18, t + i * 0.15);
        gain.gain.setValueAtTime(0.18, t + i * 0.15 + 0.12);
        gain.gain.setValueAtTime(0.001, t + i * 0.15 + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.15);
        osc.stop(t + i * 0.15 + 0.15);
      }
    }

    playIntercomChime() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      // Ding - Dang - Dong (F4, A4, C5)
      const notes = [349.23, 440.0, 523.25];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.22);
        gain.gain.setValueAtTime(0.3, t + idx * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.22 + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.22);
        osc.stop(t + idx * 0.22 + 0.55);
      });
    }

    playCollectGrocery() {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);
        gain.gain.setValueAtTime(0.2, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.22);
      });
    }
  }

  // --- GAME CONSTANTS & ENTITIES ---
  const AUDIO = new AudioEngine();

  const LIGHT_MODES = [
    { id: 'day', name: 'DAY', icon: '☀️', asphalt: '#2b3240', ambient: 'rgba(255,255,255,0.02)' },
    { id: 'sunset', name: 'SUNSET', icon: '🌅', asphalt: '#382b3a', ambient: 'rgba(251,146,60,0.14)' },
    { id: 'night', name: 'NIGHT', icon: '🌙', asphalt: '#141824', ambient: 'rgba(15,23,42,0.65)' }
  ];

  const PA_ANNOUNCEMENTS = [
    "MegaMart PA: \"Attention shoppers, the runaway cart in Lot C is traveling faster than company policy permits.\"",
    "MegaMart PA: \"Cleanup in Row 3: A jar of Mega Mayonnaise was launched across three parking spots.\"",
    "MegaMart PA: \"Special offer: Free hot dog to anyone who can steer that wobbly cart in a straight line for 5 seconds.\"",
    "MegaMart PA: \"Security to Row 9: The defective caster wheel has reached 4,500 RPM and is causing seismological readings.\"",
    "MegaMart PA: \"Lost and found: One French baguette, slightly dented by an emergency drift stop.\"",
    "MegaMart PA: \"Reminder: Kicking the front-right wheel does not void warranty, mostly because there is no warranty.\"",
    "MegaMart PA: \"Pigeons in Lot C are advised to seek immediate higher ground.\""
  ];

  // --- STATE ---
  let canvas, ctx;
  let width, height;
  let currentLightModeIdx = 0;
  let pigeonsSpookedTotal = 0;
  let kickStreak = 0;
  let kickStreakTimer = 0;
  let superHyperdriveTime = 0;
  let toastTimer = null;

  // Input states
  const keys = {};
  let isDraggingMouse = false;
  let mouseTarget = null;
  let isTouching = false;
  let touchJoystickVector = { x: 0, y: 0 };
  let isTurboActive = false;

  // Camera
  const camera = {
    x: 0,
    y: 0,
    zoom: 1,
    shake: 0
  };

  // Particles
  const particles = [];
  function spawnParticle(x, y, vx, vy, color, size, life, type = 'spark') {
    particles.push({ x, y, vx, vy, color, size, life, maxLife: life, type });
  }

  // --- GROCERIES IN BASKET ---
  const GROCERY_TYPES = [
    { id: 'mayo', name: 'Mega Mayo', emoji: '🫙', color: '#fef08a', weight: 1.2, x: -8, y: -6 },
    { id: 'tp', name: '32-Pack TP', emoji: '🧻', color: '#f8fafc', weight: 0.5, x: 8, y: -6 },
    { id: 'beans', name: 'Canned Beans', emoji: '🥫', color: '#ef4444', weight: 0.9, x: -8, y: 8 },
    { id: 'baguette', name: 'Crispy Baguette', emoji: '🥖', color: '#f59e0b', weight: 0.4, x: 7, y: 10 },
    { id: 'melon', name: 'Watermelon', emoji: '🍉', color: '#22c55e', weight: 2.0, x: 0, y: -16 },
    { id: 'cereal', name: 'Sugar Crunch', emoji: '🥣', color: '#38bdf8', weight: 0.6, x: 0, y: 18 }
  ];

  let cartGroceries = GROCERY_TYPES.map(g => ({ ...g, inBasket: true, bounceZ: 0, vz: 0 }));
  const droppedGroceries = [];

  // --- SHOPPING CART PHYSICS OBJECT ---
  const cart = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0, // In radians (0 = pointing right)
    angularVel: 0,
    width: 44,
    length: 64,

    // Caster Wheel Status
    wheelRpm: 1200,
    targetRpm: 1200,
    casterVibration: 0,
    wobblePhase: 0,
    kickStunTimer: 0,
    rightwardPullTorque: 0.038, // Continuous torque bias!

    // Vertical bounce (speed bumps / impacts)
    z: 0,
    vz: 0,

    update(dt) {
      // 1. Process Input Forces
      let forwardForce = 0;
      let turnInput = 0;

      // Keyboard Inputs
      if (keys['KeyW'] || keys['ArrowUp']) forwardForce += 1;
      if (keys['KeyS'] || keys['ArrowDown']) forwardForce -= 0.65;
      if (keys['KeyA'] || keys['ArrowLeft']) turnInput -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) turnInput += 1;

      // Mouse drag steering / push
      if (isDraggingMouse && mouseTarget) {
        const dx = mouseTarget.x - this.x;
        const dy = mouseTarget.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 30) {
          const targetAngle = Math.atan2(dy, dx);
          let angleDiff = targetAngle - this.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          turnInput += Math.max(-1, Math.min(1, angleDiff * 2.2));
          forwardForce += Math.min(1.2, dist / 120);
        }
      }

      // Touch Joystick
      if (isTouching) {
        forwardForce += -touchJoystickVector.y;
        turnInput += touchJoystickVector.x;
      }

      // Turbo boost multiplier
      const isTurbo = isTurboActive || keys['ShiftLeft'] || keys['ShiftRight'] || keys['Space'];
      const forceMultiplier = isTurbo ? 2.1 : 1.0;
      const maxSpeed = isTurbo ? 16 : 9.5;

      // 2. Defective Caster RPM Dynamics
      const currentSpeed = Math.hypot(this.vx, this.vy);
      if (superHyperdriveTime > 0) {
        superHyperdriveTime -= dt;
        this.targetRpm = 8800 + Math.random() * 800;
      } else if (this.kickStunTimer > 0) {
        this.kickStunTimer -= dt;
        this.targetRpm = 200; // Calmed down briefly
      } else {
        // Normal RPM is 800 idle + speed-proportional up to ~4500 RPM
        this.targetRpm = 850 + (currentSpeed / 10) * 3600;
        if (isTurbo) this.targetRpm += 1200;
      }

      // Smooth RPM transition
      this.wheelRpm += (this.targetRpm - this.wheelRpm) * (dt * 7);
      this.wobblePhase += (this.wheelRpm / 60) * Math.PI * 2 * dt;

      // 3. Wobbly Defective Torque Pull (The Core Punchline!)
      // Right front wheel vibrates violently and imparts asymmetrical torque
      let brokenWheelTorque = 0;
      if (this.kickStunTimer <= 0) {
        const wobbleIntensity = Math.min(this.wheelRpm / 4000, 1.8);
        // Sinusoidal high-frequency rattle
        const rattle = Math.sin(this.wobblePhase) * 0.045 * wobbleIntensity;
        // Violent persistent starboard pull (drifting to right)
        const constantRightPull = this.rightwardPullTorque * (0.6 + wobbleIntensity * 0.9);
        brokenWheelTorque = constantRightPull + rattle;

        if (superHyperdriveTime > 0) {
          brokenWheelTorque *= 2.5; // Spins like a top!
        }
      }

      // 4. Update Angular Velocity & Heading
      const steerPower = 0.075;
      this.angularVel += (turnInput * steerPower + brokenWheelTorque) * (dt * 60);
      this.angularVel *= Math.pow(0.82, dt * 60); // Angular damping
      this.angle += this.angularVel * (dt * 60);

      // 5. Linear Forces along Heading Vector
      const headingX = Math.cos(this.angle);
      const headingY = Math.sin(this.angle);

      // Forward acceleration
      const accel = forwardForce * 0.38 * forceMultiplier;
      this.vx += headingX * accel * (dt * 60);
      this.vy += headingY * accel * (dt * 60);

      // Lateral vs longitudinal friction (simulate wheels rolling forward but resisting sideways slip)
      const forwardVelocity = this.vx * headingX + this.vy * headingY;
      const lateralVelocity = -this.vx * headingY + this.vy * headingX;

      // Check if on oil slick
      let lateralFriction = 0.86;
      for (const slick of parkingLot.oilSlicks) {
        if (Math.hypot(this.x - slick.x, this.y - slick.y) < slick.radius) {
          lateralFriction = 0.99; // Super slippy drift!
          spawnParticle(this.x, this.y, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, '#6366f1', 4, 0.4, 'smoke');
          break;
        }
      }

      const newForwardVel = forwardVelocity * Math.pow(0.965, dt * 60);
      const newLateralVel = lateralVelocity * Math.pow(lateralFriction, dt * 60);

      this.vx = headingX * newForwardVel - headingY * newLateralVel;
      this.vy = headingY * newForwardVel + headingX * newLateralVel;

      // Cap max speed
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > maxSpeed) {
        this.vx = (this.vx / speed) * maxSpeed;
        this.vy = (this.vy / speed) * maxSpeed;
      }

      this.x += this.vx * (dt * 60);
      this.y += this.vy * (dt * 60);

      // 6. Vertical Bounce & Grocery Physics
      if (this.z > 0 || this.vz !== 0) {
        this.vz -= 30 * dt; // Gravity
        this.z += this.vz * (dt * 60);
        if (this.z <= 0) {
          this.z = 0;
          this.vz = 0;
          AUDIO.playClatter();
        }
      }

      // Wheel sparks & smoke from broken front-right caster
      const frontRightX = this.x + Math.cos(this.angle + 0.6) * 32;
      const frontRightY = this.y + Math.sin(this.angle + 0.6) * 32;

      if (this.wheelRpm > 2500 && Math.random() < (this.wheelRpm / 5000)) {
        const sparkSpeed = 2 + Math.random() * 4;
        const sparkAngle = this.angle + Math.PI + (Math.random() - 0.5) * 1.2;
        spawnParticle(
          frontRightX, frontRightY,
          Math.cos(sparkAngle) * sparkSpeed,
          Math.sin(sparkAngle) * sparkSpeed,
          Math.random() > 0.3 ? '#fbbf24' : '#ef4444',
          Math.random() * 2.5 + 1,
          0.35 + Math.random() * 0.25,
          'spark'
        );
      }

      if (this.wheelRpm > 3200 && Math.random() < 0.35) {
        spawnParticle(
          frontRightX, frontRightY,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
          'rgba(203, 213, 225, 0.4)',
          Math.random() * 6 + 4,
          0.6,
          'smoke'
        );
      }

      // Check Groceries in basket
      for (const g of cartGroceries) {
        if (!g.inBasket) continue;
        if (this.vz > 4 || Math.abs(this.angularVel) > 0.08) {
          g.vz += (Math.random() * 2 + 1) * dt * 40;
        }
        if (g.bounceZ > 0 || g.vz !== 0) {
          g.vz -= 25 * dt;
          g.bounceZ += g.vz * (dt * 60);
          if (g.bounceZ <= 0) {
            g.bounceZ = 0;
            g.vz = 0;
          }
          // Catastrophic ejection if bounced way too high or violent crash
          if (g.bounceZ > 36 || (Math.abs(this.angularVel) > 0.16 && Math.random() < 0.05)) {
            ejectGrocery(g, this.x, this.y, this.vx, this.vy);
          }
        }
      }

      // Screen shake linked to caster vibration
      camera.shake = Math.min((this.wheelRpm / 4500) * 3.5, 7);

      // Sound update
      AUDIO.updateContinuousSounds(speed, this.wheelRpm);
    },

    kick() {
      AUDIO.playKickSound(superHyperdriveTime > 0);
      kickStreakTimer = 1.8;
      kickStreak++;

      // Easter egg: Triple kick activates SUPER HYPERDRIVE!
      if (kickStreak >= 3) {
        superHyperdriveTime = 6.0;
        kickStreak = 0;
        showToast("⚡ SUPER HYPERDRIVE ACTIVATED! 9,000 RPM DEFECTIVE TURBINE! ⚡", '🚀');
        return;
      }

      // Normal kick: resets wobble and knocks wheel into momentary compliance
      this.kickStunTimer = 1.6;
      this.wheelRpm = 400;
      this.angularVel *= 0.2;
      spawnParticle(this.x, this.y, 0, 0, '#38bdf8', 12, 0.4, 'shockwave');
      showToast("BOOT DELIVERED! Caster wheel temporarily stunned.", '👢');
    }
  };

  function ejectGrocery(grocery, x, y, vx, vy) {
    grocery.inBasket = false;
    droppedGroceries.push({
      ...grocery,
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: vx * 0.7 + (Math.random() - 0.5) * 5,
      vy: vy * 0.7 + (Math.random() - 0.5) * 5,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.2
    });
    updateGroceriesHUD();
    AUDIO.playClatter();
    showToast(`Oops! Your ${grocery.name} flew out onto the asphalt!`, grocery.emoji);
  }

  // --- PARKING LOT ENVIRONMENT & OBJECTS ---
  const parkingLot = {
    corralX: -350,
    corralY: -200,
    corralW: 90,
    corralH: 140,
    cars: [],
    speedBumps: [],
    oilSlicks: [],
    pigeons: [],
    plasticBags: [],

    init() {
      // Parked Cars
      const carColors = ['#ef4444', '#3b82f6', '#94a3b8', '#10b981', '#f59e0b', '#8b5cf6'];
      for (let row = -3; row <= 3; row++) {
        for (let col = -3; col <= 3; col++) {
          if (row === 0 && col === 0) continue; // Spawn clearing
          if (Math.random() < 0.4) {
            this.cars.push({
              x: col * 260 + 80,
              y: row * 220 + 60,
              w: 58,
              h: 110,
              color: carColors[Math.floor(Math.random() * carColors.length)],
              alarmTimer: 0,
              angle: Math.random() < 0.5 ? 0 : Math.PI
            });
          }
        }
      }

      // Speed Bumps
      this.speedBumps.push({ x: 0, y: -300, w: 280, h: 24 });
      this.speedBumps.push({ x: -400, y: 150, w: 24, h: 280 });
      this.speedBumps.push({ x: 450, y: 120, w: 260, h: 24 });

      // Oil Slicks
      this.oilSlicks.push({ x: 180, y: -120, radius: 48 });
      this.oilSlicks.push({ x: -280, y: 220, radius: 55 });
      this.oilSlicks.push({ x: 380, y: -340, radius: 50 });

      // Pigeons
      for (let i = 0; i < 28; i++) {
        this.pigeons.push({
          x: (Math.random() - 0.5) * 1800,
          y: (Math.random() - 0.5) * 1800,
          vx: 0,
          vy: 0,
          peckTimer: Math.random() * 2,
          isFleeing: false,
          flyTimer: 0,
          wingPhase: 0,
          angle: Math.random() * Math.PI * 2
        });
      }

      // Windblown Plastic Bags
      for (let i = 0; i < 3; i++) {
        this.plasticBags.push({
          x: (Math.random() - 0.5) * 1200,
          y: (Math.random() - 0.5) * 1200,
          vx: 0.8 + Math.random() * 0.5,
          vy: 0.3 + Math.random() * 0.4,
          rot: 0,
          size: 16
        });
      }
    },

    update(dt) {
      // 1. Check Car Collisions
      for (const car of this.cars) {
        if (car.alarmTimer > 0) car.alarmTimer -= dt;

        const dx = cart.x - car.x;
        const dy = cart.y - car.y;
        if (Math.abs(dx) < (cart.width / 2 + car.w / 2) && Math.abs(dy) < (cart.length / 2 + car.h / 2)) {
          // Elastic bounce
          cart.vx *= -0.7;
          cart.vy *= -0.7;
          cart.angularVel += (Math.random() - 0.5) * 0.2;
          cart.vz = 4;
          AUDIO.playClatter();

          if (car.alarmTimer <= 0) {
            car.alarmTimer = 4.0;
            AUDIO.playCarAlarm();
            showToast("BUMP! Minivan anti-theft alarm triggered!", '🚨');
          }
        }
      }

      // 2. Check Speed Bumps
      for (const bump of this.speedBumps) {
        if (
          cart.x > bump.x - bump.w / 2 && cart.x < bump.x + bump.w / 2 &&
          cart.y > bump.y - bump.h / 2 && cart.y < bump.y + bump.h / 2
        ) {
          if (cart.z === 0 && Math.hypot(cart.vx, cart.vy) > 2) {
            cart.vz = 8.5; // Jump cart!
            AUDIO.playSpeedBump();
          }
        }
      }

      // 3. Check Cart Return Corral (+0.25 deposit)
      const inCorral = (
        cart.x > this.corralX - this.corralW / 2 && cart.x < this.corralX + this.corralW / 2 &&
        cart.y > this.corralY - this.corralH / 2 && cart.y < this.corralY + this.corralH / 2
      );
      if (inCorral && Math.hypot(cart.vx, cart.vy) < 1.5) {
        if (!this.corralCelebrated) {
          this.corralCelebrated = true;
          AUDIO.playCollectGrocery();
          showToast("🎉 CART RETURNED! $0.25 Quarter Deposit Recovered! You are a civilized human! 🎉", '🪙');
        }
      } else {
        this.corralCelebrated = false;
      }

      // 4. Update Pigeons (AI & Scattering)
      for (const p of this.pigeons) {
        const distToCart = Math.hypot(cart.x - p.x, cart.y - p.y);

        if (distToCart < 140 && !p.isFleeing) {
          p.isFleeing = true;
          p.flyTimer = 2.5;
          const fleeAngle = Math.atan2(p.y - cart.y, p.x - cart.x) + (Math.random() - 0.5) * 0.4;
          p.vx = Math.cos(fleeAngle) * (6 + Math.random() * 4);
          p.vy = Math.sin(fleeAngle) * (6 + Math.random() * 4);
          pigeonsSpookedTotal++;
          updatePigeonsHUD();
          AUDIO.playPigeonPanic();

          // Feather particles
          for (let f = 0; f < 3; f++) {
            spawnParticle(p.x, p.y, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, '#94a3b8', 3, 0.8, 'feather');
          }
        }

        if (p.isFleeing) {
          p.flyTimer -= dt;
          p.wingPhase += dt * 30;
          p.x += p.vx * (dt * 60);
          p.y += p.vy * (dt * 60);
          p.vx *= 0.98;
          p.vy *= 0.98;
          if (p.flyTimer <= 0) {
            p.isFleeing = false;
            p.vx = 0;
            p.vy = 0;
          }
        } else {
          // Idling & pecking
          p.peckTimer -= dt;
          if (p.peckTimer <= 0) {
            p.peckTimer = 1 + Math.random() * 2;
            p.angle += (Math.random() - 0.5) * 1.5;
          }
        }
      }

      // 5. Update Dropped Groceries & Scooping Back
      for (let i = droppedGroceries.length - 1; i >= 0; i--) {
        const dg = droppedGroceries[i];
        dg.x += dg.vx * (dt * 60);
        dg.y += dg.vy * (dt * 60);
        dg.vx *= 0.92;
        dg.vy *= 0.92;
        dg.rot += dg.vRot;

        // Drive over dropped grocery to scoop it back!
        const dist = Math.hypot(cart.x - dg.x, cart.y - dg.y);
        if (dist < 45) {
          const orig = cartGroceries.find(g => g.id === dg.id);
          if (orig) orig.inBasket = true;
          droppedGroceries.splice(i, 1);
          updateGroceriesHUD();
          AUDIO.playCollectGrocery();
          showToast(`SCOOPED! ${dg.name} recovered back into basket!`, '🛒');
        }
      }

      // 6. Update Windblown Plastic Bags
      for (const bag of this.plasticBags) {
        bag.x += bag.vx * (dt * 60);
        bag.y += bag.vy * (dt * 60);
        bag.rot += 0.02;
        if (bag.x > 1200) bag.x = -1200;
        if (bag.y > 1200) bag.y = -1200;
      }
    }
  };

  // --- HUD UPDATERS ---
  function updateGroceriesHUD() {
    const loadedCount = cartGroceries.filter(g => g.inBasket).length;
    const el = document.getElementById('groceries-count');
    if (el) el.textContent = `${loadedCount} / ${cartGroceries.length}`;
  }

  function updatePigeonsHUD() {
    const el = document.getElementById('pigeons-count');
    if (el) el.textContent = pigeonsSpookedTotal;
  }

  function showToast(message, icon = '📢') {
    const banner = document.getElementById('toast-banner');
    const msgEl = document.getElementById('toast-text');
    const iconEl = document.getElementById('toast-icon');
    if (!banner || !msgEl) return;

    msgEl.textContent = message;
    if (iconEl) iconEl.textContent = icon;
    banner.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      banner.classList.remove('show');
    }, 4500);
  }

  // --- RENDERING PIPELINE ---
  function render() {
    const light = LIGHT_MODES[currentLightModeIdx];

    // Clear background
    ctx.fillStyle = light.asphalt;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Camera transform + screen shake
    const shakeX = (Math.random() - 0.5) * camera.shake;
    const shakeY = (Math.random() - 0.5) * camera.shake;
    ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw Parking Bay Grid
    drawParkingLotGrid(light);

    // 2. Draw Speed Bumps
    drawSpeedBumps();

    // 3. Draw Oil Slicks
    drawOilSlicks();

    // 4. Draw Cart Return Corral
    drawCorral();

    // 5. Draw Parked Cars
    drawCars();

    // 6. Draw Dropped Groceries on Asphalt
    drawDroppedGroceries();

    // 7. Draw Runaway Pigeons
    drawPigeons();

    // 8. Draw Shopping Cart
    drawCart();

    // 9. Draw Particles
    drawParticles();

    // 10. Draw Ambient Lighting Overlay
    ctx.restore();

    if (light.ambient) {
      ctx.fillStyle = light.ambient;
      ctx.fillRect(0, 0, width, height);
    }

    // Update Telemetry Gauges in DOM
    updateTelemetryDOM();
  }

  function drawParkingLotGrid(light) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);

    // Outer boundaries & road lanes
    const range = 1800;
    const step = 260;

    for (let x = -range; x <= range; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, -range);
      ctx.lineTo(x, range);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Parking spaces (yellow stall markings)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    for (let col = -6; col <= 6; col++) {
      for (let row = -6; row <= 6; row++) {
        const px = col * 260 + 50;
        const py = row * 220 + 30;
        ctx.strokeRect(px - 40, py - 60, 80, 120);
      }
    }

    // Directional asphalt arrows
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let y = -900; y <= 900; y += 450) {
      drawAsphaltArrow(-120, y);
      drawAsphaltArrow(400, y);
    }
  }

  function drawAsphaltArrow(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(16, -10);
    ctx.lineTo(6, -10);
    ctx.lineTo(6, 25);
    ctx.lineTo(-6, 25);
    ctx.lineTo(-6, -10);
    ctx.lineTo(-16, -10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSpeedBumps() {
    for (const bump of parkingLot.speedBumps) {
      ctx.save();
      ctx.translate(bump.x, bump.y);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-bump.w / 2, -bump.h / 2, bump.w, bump.h);

      // Yellow/Black diagonal stripes
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      const step = 14;
      if (bump.w > bump.h) {
        for (let sx = -bump.w / 2; sx < bump.w / 2; sx += step) {
          ctx.beginPath();
          ctx.moveTo(sx, -bump.h / 2);
          ctx.lineTo(sx + 10, bump.h / 2);
          ctx.stroke();
        }
      } else {
        for (let sy = -bump.h / 2; sy < bump.h / 2; sy += step) {
          ctx.beginPath();
          ctx.moveTo(-bump.w / 2, sy);
          ctx.lineTo(bump.w / 2, sy + 10);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawOilSlicks() {
    for (const slick of parkingLot.oilSlicks) {
      const grad = ctx.createRadialGradient(slick.x, slick.y, 4, slick.x, slick.y, slick.radius);
      grad.addColorStop(0, '#312e81');
      grad.addColorStop(0.5, '#7c3aed');
      grad.addColorStop(0.8, '#06b6d4');
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(slick.x, slick.y, slick.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCorral() {
    const { corralX, corralY, corralW, corralH } = parkingLot;
    ctx.save();
    ctx.translate(corralX, corralY);

    // Ground mark
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(-corralW / 2, -corralH / 2, corralW, corralH);

    // Metal rails
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 5;
    ctx.strokeRect(-corralW / 2, -corralH / 2, corralW, corralH);

    // Sign
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-corralW / 2 + 5, -corralH / 2 - 16, corralW - 10, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CART RETURN 🛒', 0, -corralH / 2 - 4);
    ctx.restore();
  }

  function drawCars() {
    for (const car of parkingLot.cars) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(-car.w / 2 + 4, -car.h / 2 + 4, car.w, car.h);

      // Car body
      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(-car.w / 2, -car.h / 2, car.w, car.h, 10);
      ctx.fill();

      // Roof & Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-car.w / 2 + 6, -car.h / 4, car.w - 12, car.h / 2);

      // Flashing alarm headlights
      if (car.alarmTimer > 0 && Math.floor(Date.now() / 150) % 2 === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-car.w / 3, -car.h / 2 - 2, 8, 0, Math.PI * 2);
        ctx.arc(car.w / 3, -car.h / 2 - 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function drawDroppedGroceries() {
    for (const dg of droppedGroceries) {
      ctx.save();
      ctx.translate(dg.x, dg.y);
      ctx.rotate(dg.rot);
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dg.emoji, 0, 0);

      // Pulsing rescue ring
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPigeons() {
    for (const p of parkingLot.pigeons) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.isFleeing ? Math.atan2(p.vy, p.vx) : p.angle);

      // Pigeon Body
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(6, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(9, -2);
      ctx.lineTo(13, 0);
      ctx.lineTo(9, 2);
      ctx.fill();

      // Wings (Flapping when fleeing)
      if (p.isFleeing) {
        const wingSpan = Math.sin(p.wingPhase) * 9;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-2, -wingSpan, 5, Math.abs(wingSpan));
        ctx.fillRect(-2, 0, 5, Math.abs(wingSpan));
      }
      ctx.restore();
    }
  }

  function drawCart() {
    ctx.save();
    ctx.translate(cart.x, cart.y);
    ctx.rotate(cart.angle);

    // Vertical bounce offset
    const bZ = cart.z;

    // Cart Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.roundRect(-cart.length / 2 + 5, -cart.width / 2 + 5, cart.length, cart.width, 8);
    ctx.fill();

    // 1. Draw Wheels
    drawWheel(-22, -18, 0, 'ok'); // Rear Left
    drawWheel(-22, 18, 0, 'ok');  // Rear Right
    drawWheel(22, -18, cart.angularVel * 2, 'ok'); // Front Left

    // Front Right (The Infamous 4,000 RPM Caster!)
    drawDefectiveWheel(22, 18, cart.wobblePhase, cart.wheelRpm);

    // 2. Wire Mesh Chassis (Metallic)
    ctx.translate(0, -bZ); // Apply vertical lift

    // Chrome Frame
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.strokeRect(-cart.length / 2, -cart.width / 2, cart.length, cart.width);

    // Metal Basket Grate Lines
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 1.2;
    for (let x = -cart.length / 2 + 8; x < cart.length / 2; x += 7) {
      ctx.beginPath();
      ctx.moveTo(x, -cart.width / 2);
      ctx.lineTo(x, cart.width / 2);
      ctx.stroke();
    }
    for (let y = -cart.width / 2 + 6; y < cart.width / 2; y += 6) {
      ctx.beginPath();
      ctx.moveTo(-cart.length / 2, y);
      ctx.lineTo(cart.length / 2, y);
      ctx.stroke();
    }

    // Handlebar (Rear) with Red Plastic Grip
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-cart.length / 2 - 10, -cart.width / 2 - 2, 7, cart.width + 4, 3);
    ctx.fill();

    // Bicycle Bell on Handlebar
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(-cart.length / 2 - 7, -cart.width / 2 + 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // 3. Groceries Inside Basket
    for (const g of cartGroceries) {
      if (!g.inBasket) continue;
      ctx.save();
      ctx.translate(g.x, g.y - g.bounceZ);
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(g.emoji, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawWheel(x, y, swivel, status) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(swivel);
    ctx.fillStyle = '#475569';
    ctx.fillRect(-6, -3, 12, 6);
    ctx.restore();
  }

  function drawDefectiveWheel(x, y, wobblePhase, rpm) {
    ctx.save();
    ctx.translate(x, y);

    // Violent chaotic rotation & blur
    const wobbleAngle = Math.sin(wobblePhase) * 0.6;
    ctx.rotate(wobbleAngle);

    // Glow ring if high RPM
    if (rpm > 2500) {
      ctx.strokeStyle = rpm > 4200 ? '#ef4444' : '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Defective Caster Body
    ctx.fillStyle = rpm > 4000 ? '#ef4444' : '#f97316';
    ctx.fillRect(-7, -4, 14, 8);

    // Sparks indicator
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(4, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.016;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (1 - alpha) * 45, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2 - alpha), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Sparks
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function updateTelemetryDOM() {
    // RPM digits & gauge bar
    const rpmDigits = document.getElementById('rpm-digits');
    const rpmBar = document.getElementById('rpm-bar');
    if (rpmDigits) rpmDigits.textContent = Math.round(cart.wheelRpm).toLocaleString();
    if (rpmBar) {
      const pct = Math.min(100, Math.max(8, (cart.wheelRpm / 5500) * 100));
      rpmBar.style.width = `${pct}%`;
    }

    // Drift Needle
    const driftNeedle = document.getElementById('drift-needle');
    if (driftNeedle) {
      // 50% is center, biased towards 75-95% right
      const pullPct = 50 + (cart.rightwardPullTorque / 0.05) * 40;
      driftNeedle.style.left = `${Math.min(95, Math.max(5, pullPct))}%`;
    }
  }

  // --- MAIN LOOP ---
  let lastTime = performance.now();
  function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.06);
    lastTime = time;

    // Update entities
    cart.update(dt);
    parkingLot.update(dt);

    if (kickStreakTimer > 0) {
      kickStreakTimer -= dt;
      if (kickStreakTimer <= 0) kickStreak = 0;
    }

    // Camera follow cart smoothly
    camera.x += (cart.x - camera.x) * (dt * 5);
    camera.y += (cart.y - camera.y) * (dt * 5);

    render();
    requestAnimationFrame(gameLoop);
  }

  // --- EVENT LISTENERS & USER INPUT ---
  function setupInputs() {
    // Resize handling
    window.addEventListener('resize', onResize);
    onResize();

    // Keyboard events
    window.addEventListener('keydown', e => {
      AUDIO.init();
      AUDIO.resume();

      keys[e.code] = true;

      if (e.code === 'KeyK') cart.kick();
      if (e.code === 'KeyH') AUDIO.playDingBell();
      if (e.code === 'KeyM') toggleSound();
      if (e.code === 'KeyL') cycleLighting();
      if (e.code === 'KeyP') broadcastPA();
      if (e.code === 'KeyI') toggleModal('inspect-modal');
      if (e.code === 'Slash' && e.shiftKey) toggleModal('help-modal');
    });

    window.addEventListener('keyup', e => {
      keys[e.code] = false;
    });

    // Mouse Controls (Push & Steer)
    canvas.addEventListener('mousedown', e => {
      AUDIO.init();
      AUDIO.resume();
      isDraggingMouse = true;
      updateMouseTarget(e);
    });

    window.addEventListener('mousemove', e => {
      if (isDraggingMouse) updateMouseTarget(e);
    });

    window.addEventListener('mouseup', () => {
      isDraggingMouse = false;
      mouseTarget = null;
    });

    function updateMouseTarget(e) {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      // Convert screen coords to world coords
      mouseTarget = {
        x: (screenX - width / 2) / camera.zoom + camera.x,
        y: (screenY - height / 2) / camera.zoom + camera.y
      };
    }

    // Touch Controls (Mobile Virtual Joystick)
    const joystickZone = document.getElementById('touch-joystick-zone');
    const joystickStick = document.getElementById('touch-joystick-stick');
    let touchId = null;
    let baseRect = null;

    if (joystickZone) {
      joystickZone.addEventListener('touchstart', e => {
        AUDIO.init();
        AUDIO.resume();
        const t = e.changedTouches[0];
        touchId = t.identifier;
        isTouching = true;
        baseRect = joystickZone.getBoundingClientRect();
        updateJoystick(t.clientX, t.clientY);
        e.preventDefault();
      }, { passive: false });

      window.addEventListener('touchmove', e => {
        if (!isTouching) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            updateJoystick(t.clientX, t.clientY);
            break;
          }
        }
      });

      const endTouch = e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            isTouching = false;
            touchJoystickVector = { x: 0, y: 0 };
            if (joystickStick) joystickStick.style.transform = 'translate(0, 0)';
            break;
          }
        }
      };

      window.addEventListener('touchend', endTouch);
      window.addEventListener('touchcancel', endTouch);

      function updateJoystick(cx, cy) {
        if (!baseRect) return;
        const centerX = baseRect.left + baseRect.width / 2;
        const centerY = baseRect.top + baseRect.height / 2;
        const maxDist = baseRect.width / 2;

        let dx = cx - centerX;
        let dy = cy - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }

        touchJoystickVector = {
          x: dx / maxDist,
          y: dy / maxDist
        };

        if (joystickStick) {
          joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      }
    }

    // UI Buttons
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) btnSound.onclick = toggleSound;

    const btnLighting = document.getElementById('btn-lighting');
    if (btnLighting) btnLighting.onclick = cycleLighting;

    const btnIntercom = document.getElementById('btn-intercom');
    if (btnIntercom) btnIntercom.onclick = broadcastPA;

    const btnInspect = document.getElementById('btn-inspect');
    if (btnInspect) btnInspect.onclick = () => toggleModal('inspect-modal');

    const btnHelp = document.getElementById('btn-help');
    if (btnHelp) btnHelp.onclick = () => toggleModal('help-modal');

    const btnKick = document.getElementById('btn-kick');
    if (btnKick) btnKick.onclick = () => { AUDIO.init(); cart.kick(); };

    const btnKickModal = document.getElementById('btn-kick-from-modal');
    if (btnKickModal) btnKickModal.onclick = () => {
      toggleModal('inspect-modal');
      AUDIO.init();
      cart.kick();
    };

    const btnBell = document.getElementById('btn-bell');
    if (btnBell) btnBell.onclick = () => { AUDIO.init(); AUDIO.playDingBell(); };

    const btnTurbo = document.getElementById('btn-turbo');
    if (btnTurbo) {
      btnTurbo.addEventListener('mousedown', () => { isTurboActive = true; });
      btnTurbo.addEventListener('mouseup', () => { isTurboActive = false; });
      btnTurbo.addEventListener('touchstart', (e) => { isTurboActive = true; e.preventDefault(); });
      btnTurbo.addEventListener('touchend', () => { isTurboActive = false; });
    }

    // Modal Close buttons
    ['inspect-close-btn', 'btn-close-inspect', 'help-close-btn', 'btn-close-help'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.onclick = () => {
        document.getElementById('inspect-modal')?.classList.add('hidden');
        document.getElementById('help-modal')?.classList.add('hidden');
      };
    });
  }

  function toggleSound() {
    AUDIO.init();
    const active = AUDIO.toggleMute();
    const icon = document.getElementById('sound-icon');
    const text = document.getElementById('sound-text');
    if (icon) icon.textContent = active ? '🔊' : '🔇';
    if (text) text.textContent = active ? 'AUDIO ON' : 'MUTED';
  }

  function cycleLighting() {
    currentLightModeIdx = (currentLightModeIdx + 1) % LIGHT_MODES.length;
    const mode = LIGHT_MODES[currentLightModeIdx];
    const icon = document.getElementById('lighting-icon');
    const text = document.getElementById('lighting-text');
    if (icon) icon.textContent = mode.icon;
    if (text) text.textContent = mode.name;
    showToast(`Time shifted: ${mode.name} in MegaMart Lot C`, mode.icon);
  }

  function broadcastPA() {
    AUDIO.init();
    AUDIO.playIntercomChime();
    const msg = PA_ANNOUNCEMENTS[Math.floor(Math.random() * PA_ANNOUNCEMENTS.length)];
    showToast(msg, '📢');
  }

  function toggleModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden');
  }

  function onResize() {
    if (!canvas) return;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }

  // --- INITIALIZATION ---
  window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    setupInputs();
    parkingLot.init();
    updateGroceriesHUD();
    updatePigeonsHUD();

    requestAnimationFrame(gameLoop);
  });
})();
