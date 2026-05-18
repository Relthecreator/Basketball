// ==========================================
// MYTHIC EFFECTS & PHONK AUDIO ENGINE
// Save this exact code into effects.js
// ==========================================

const MythicEngine = {
    audioCtx: null,
    auraLoopId: null,
    phonkStep: 0,
    explosionParticles: [],
    explosionActive: false,
    explosionTimer: 0,
    
    // Void Assets
    mythicGroup: null,
    voidGroup: null,
    voidBeams: [],
    voidBubbles: [],
    planet1: null,
    planet2: null,
    planet3: null,
    eyeRing1: null,
    eyeRing2: null,
    activeMythic: null,
    mythicTimer: 0,

    // 1. AUDIO SYSTEM
    initAudio: function() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    },

    playSound: function(type) {
        if (!this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        
        if (type === 'explosion') {
            const bufSize = this.audioCtx.sampleRate * 0.5; const buffer = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0); for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.audioCtx.createBufferSource(); noise.buffer = buffer;
            const filter = this.audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(2000, t); filter.frequency.exponentialRampToValueAtTime(100, t + 0.3);
            const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(1.5, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            noise.connect(filter); filter.connect(gain); gain.connect(this.audioCtx.destination); noise.start(t);
        } else if (type === 'void_boom') {
            const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(90, t); osc.frequency.exponentialRampToValueAtTime(5, t + 4.0);
            gain.gain.setValueAtTime(4.0, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
            const filter = this.audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(150, t);
            osc.connect(filter); filter.connect(gain); gain.connect(this.audioCtx.destination); osc.start(t); osc.stop(t + 4.0);
            this.playSound('explosion');
        }
    },

    // PHONK BEAT SYNTH (808s & Cowbells)
    play808Node: function(t, freq) {
        if(!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(freq/2, t + 0.5); 
        gain.gain.setValueAtTime(1.5, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        const filter = this.audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(200, t); 
        osc.connect(filter); filter.connect(gain); gain.connect(this.audioCtx.destination); osc.start(t); osc.stop(t + 0.6);
    },
    playCowbellNode: function(t, freq) {
        if(!this.audioCtx) return;
        const osc1 = this.audioCtx.createOscillator(); const osc2 = this.audioCtx.createOscillator(); const gain = this.audioCtx.createGain();
        osc1.type = 'square'; osc2.type = 'square'; osc1.frequency.setValueAtTime(freq, t); osc2.frequency.setValueAtTime(freq * 1.4, t);
        gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.5, t + 0.01); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        const filter = this.audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = freq * 1.2; filter.Q.value = 5;
        osc1.connect(gain); osc2.connect(gain); gain.connect(filter); filter.connect(this.audioCtx.destination); osc1.start(t); osc2.start(t); osc1.stop(t + 0.3); osc2.stop(t + 0.3);
    },
    playHat: function(t) {
        if(!this.audioCtx) return;
        const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.1, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0); for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.audioCtx.createBufferSource(); noise.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 5000;
        const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        noise.connect(filter); filter.connect(gain); gain.connect(this.audioCtx.destination); noise.start(t);
    },
    playSnare: function(t, f = 1500) {
        if(!this.audioCtx) return;
        const buffer = this.audioCtx.createBuffer(1, this.audioCtx.sampleRate * 0.2, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0); for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.audioCtx.createBufferSource(); noise.buffer = buffer;
        const filter = this.audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = f;
        const gain = this.audioCtx.createGain(); gain.gain.setValueAtTime(1.0, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        noise.connect(filter); filter.connect(gain); gain.connect(this.audioCtx.destination); noise.start(t);
    },
    
    startAuraPhonk: function() {
        this.initAudio();
        if(this.auraLoopId) clearInterval(this.auraLoopId);
        this.phonkStep = 0;
        const notes = [349.23, 415.30, 349.23, 523.25]; // Melody
        
        this.auraLoopId = setInterval(() => {
            const t = this.audioCtx.currentTime;
            const step = this.phonkStep % 16;
            if (step === 0 || step === 10) this.play808Node(t, 43.65); 
            if (step === 4 || step === 12) this.playSnare(t, 1500); 
            if (step % 2 !== 0) this.playHat(t); 
            if (step === 0 || step === 3 || step === 6 || step === 8 || step === 11 || step === 14) {
                this.playCowbellNode(t, notes[(step % 4) % notes.length]); 
            }
            this.phonkStep++;
        }, 115); // Fast Phonk Speed
    },
    stopAuraPhonk: function() { 
        if(this.auraLoopId) clearInterval(this.auraLoopId); 
        this.auraLoopId = null; 
    },

    // 2. VISUAL ASSET INITIALIZATION
    initVisuals: function(scene) {
        // Setup Explosions
        this.particleGroup = new THREE.Group(); 
        scene.add(this.particleGroup);
        for(let i=0; i<100; i++) { 
            const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshBasicMaterial({ transparent: true })); 
            pMesh.visible = false; 
            this.particleGroup.add(pMesh); 
            this.explosionParticles.push({ mesh: pMesh, velocity: new THREE.Vector3() }); 
        }

        // Setup Infinite Void Group
        this.mythicGroup = new THREE.Group(); 
        scene.add(this.mythicGroup);
        this.voidGroup = new THREE.Group(); 
        this.mythicGroup.add(this.voidGroup);

        // Lasers (Straight down Z axis)
        const beamGeo = new THREE.CylinderGeometry(0.5, 0.5, 150, 4); 
        beamGeo.rotateX(Math.PI / 2); 
        const laserColors = [0xff0055, 0xaa00ff, 0x00ffcc, 0xffea00, 0xff00ff, 0x0055ff, 0xffffff];
        for(let i=0; i<150; i++) {
            const beamMat = new THREE.MeshBasicMaterial({color: laserColors[Math.floor(Math.random() * laserColors.length)], transparent:true, opacity: 0.9});
            const beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.set((Math.random()-0.5)*200, Math.random()*100, -200 - Math.random()*600);
            this.voidGroup.add(beam);
            this.voidBeams.push({mesh: beam, dir: new THREE.Vector3(0, 0, 1), speed: 400 + Math.random()*500}); 
        }

        // Bubbles
        const whiteWireMat = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.5});
        for(let i=0; i<30; i++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5 + Math.random()*2, 0.1, 8, 32), whiteWireMat);
            ring.position.set((Math.random()-0.5)*100, Math.random()*50, (Math.random()-0.5)*100);
            this.voidGroup.add(ring);
            this.voidBubbles.push({mesh: ring, floatSpeed: 10 + Math.random()*10, floatOffset: Math.random()*Math.PI*2});
        }

        // Massive Planets High in the Sky (Y: 200-400, Z: deep back)
        this.planet1 = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 32), new THREE.MeshBasicMaterial({ color: 0xaa00ff })); 
        this.planet1.position.set(-250, 200, -400); this.voidGroup.add(this.planet1);

        this.planet2 = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 32), new THREE.MeshBasicMaterial({ color: 0x00ffff })); 
        this.planet2.position.set(300, 250, -300); this.voidGroup.add(this.planet2);

        this.planet3 = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff6b00 })); 
        this.planet3.position.set(0, 400, -600); this.voidGroup.add(this.planet3);

        this.eyeRing1 = new THREE.Mesh(new THREE.TorusGeometry(24, 0.6, 16, 64), new THREE.MeshBasicMaterial({color: 0xffffff})); this.eyeRing1.position.set(0, 150, -300);
        this.eyeRing2 = new THREE.Mesh(new THREE.TorusGeometry(27, 2, 16, 64), new THREE.MeshBasicMaterial({color: 0xff00aa, transparent: true, opacity: 0.7})); this.eyeRing2.position.set(0, 150, -300);
        this.voidGroup.add(this.eyeRing1); this.voidGroup.add(this.eyeRing2);
        
        this.mythicGroup.visible = false;
    },

    // 3. TRIGGER LOGIC
    triggerExplosion: function(pos, colorHex) {
        this.initAudio();
        this.explosionActive = true; 
        this.explosionTimer = 0; 
        this.particleGroup.position.copy(pos);
        this.playSound('explosion');
        
        this.explosionParticles.forEach(p => {
            p.mesh.visible = true; 
            p.mesh.material.color.setHex(colorHex || 0x00ff00); 
            p.mesh.material.opacity = 1.0; 
            p.mesh.scale.setScalar(1.0);
            p.mesh.position.set(0,0,0);
            p.velocity.set((Math.random() - 0.5)*40, (Math.random() - 0.1)*40, (Math.random() - 0.5)*40);
        });
    },

    triggerVoid: function(scene, playerPos, ambientLight, spotLight) {
        this.initAudio();
        this.activeMythic = 'infinitevoid'; 
        this.mythicTimer = 0;
        this.mythicGroup.visible = true;
        this.voidGroup.visible = true;
        this.voidGroup.position.copy(playerPos);
        
        // Alter lighting
        scene.background.setHex(0x000000); 
        ambientLight.intensity = 0.5; ambientLight.color.setHex(0xaa00ff); 
        spotLight.intensity = 0.5; spotLight.color.setHex(0xff0044);
        
        this.playSound('void_boom');
    },

    // 4. UPDATE LOOP (Call this in your main game loop)
    update: function(delta, elapsedTime, playerPos) {
        // Update Explosions
        if (this.explosionActive) { 
            this.explosionTimer += delta; 
            this.explosionParticles.forEach(p => { 
                p.mesh.position.addScaledVector(p.velocity, delta); 
                p.mesh.material.opacity = Math.max(0, 1.0 - this.explosionTimer); 
                p.mesh.scale.setScalar(Math.max(0, 1.0 - this.explosionTimer)); 
                p.velocity.y -= delta * 20; // Gravity
            }); 
            if (this.explosionTimer >= 1.0) this.explosionActive = false; 
        }

        // Update Mythic Elements
        if (this.activeMythic === 'infinitevoid') {
            this.mythicTimer += delta;
            
            // Orbit Planets High Above
            this.planet1.rotation.y += delta * 0.2; 
            this.planet2.rotation.y += delta * 0.3; 
            this.planet3.rotation.y += delta * 0.15;
            
            this.planet1.position.x = playerPos.x + Math.sin(elapsedTime * 0.1) * 300; 
            this.planet1.position.z = playerPos.z + Math.cos(elapsedTime * 0.1) * -400;
            
            this.planet2.position.x = playerPos.x + Math.cos(elapsedTime * 0.15) * 250; 
            this.planet2.position.z = playerPos.z + Math.sin(elapsedTime * 0.15) * -300;
            
            this.eyeRing1.rotation.z += delta * 1.5; 
            this.eyeRing2.rotation.z -= delta * 0.8;
            
            this.voidBubbles.forEach(b => { 
                b.mesh.position.y += Math.sin(elapsedTime * b.floatSpeed + b.floatOffset) * delta * 4; 
            });

            if(this.mythicTimer > 2.4) {
                // Warp Lasers Z-Axis looping
                this.voidBeams.forEach(b => {
                    b.mesh.position.addScaledVector(b.dir, b.speed * delta);
                    // Wrap lasers far back once they pass the camera
                    if(b.mesh.position.z > playerPos.z + 100) {
                        b.mesh.position.z = playerPos.z - 800;
                    }
                });
            }
            
            // Cleanup after duration
            if (this.mythicTimer > 9.0) {
                this.activeMythic = null; 
                this.mythicGroup.visible = false; 
                return true; // Signals main game to reset lighting
            }
        }
        return false;
    }
};
