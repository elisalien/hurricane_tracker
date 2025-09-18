class RealisticSatelliteHurricane {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.audioBtn = document.getElementById('audioBtn');
        this.sensitivity = document.getElementById('sensitivity');
        this.sensValue = document.getElementById('sensValue');
        this.levelBar = document.getElementById('levelBar');
        
        // Audio
        this.audioEnabled = false;
        this.audioContext = null;
        this.analyzer = null;
        this.microphone = null;
        this.audioLevel = 0;
        this.smoothedLevel = 0;
        this.sensitivityValue = 1.0;
        
        // Hurricane data
        this.hurricanes = {
            ian: { name: "HURRICANE IAN", coords: "26.0°N, 82.5°W", data: "Cat. 4 - 155 mph" },
            katrina: { name: "HURRICANE KATRINA", coords: "29.2°N, 89.6°W", data: "Cat. 5 - 175 mph" },
            dorian: { name: "HURRICANE DORIAN", coords: "26.5°N, 76.8°W", data: "Cat. 5 - 185 mph" }
        };
        this.currentHurricane = 'ian';
        
        // Canvas properties
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.maxRadius = Math.min(this.width, this.height) / 2 - 50;
        
        // Animation
        this.time = 0;
        this.rotation = 0;
        
        // Create satellite background
        this.satelliteBackground = null;
        this.createSatelliteBackground();
        
        this.init();
    }

    createSatelliteBackground() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width;
        tempCanvas.height = this.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Base satellite gray background
        tempCtx.fillStyle = '#404040';
        tempCtx.fillRect(0, 0, this.width, this.height);
        
        // Create realistic coastlines and landmasses
        const imageData = tempCtx.createImageData(this.width, this.height);
        const data = imageData.data;
        
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const index = (y * this.width + x) * 4;
                
                // Create Florida coastline approximation
                const dx = x - this.width * 0.7;
                const dy = y - this.height * 0.3;
                const coastDistance = Math.sqrt(dx * dx + dy * dy);
                
                const dx2 = x - this.width * 0.2;
                const dy2 = y - this.height * 0.8;
                const coastDistance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                
                // Add noise for realistic coastlines
                const noise = Math.sin(x * 0.02) * Math.cos(y * 0.015) * 20;
                
                let isLand = false;
                
                // Florida peninsula
                if (coastDistance < 80 + noise && x > this.width * 0.6) isLand = true;
                // Caribbean islands
                if (coastDistance2 < 40 + noise) isLand = true;
                
                if (isLand) {
                    // Land - yellowish gray
                    data[index] = 180;     // R
                    data[index + 1] = 175; // G
                    data[index + 2] = 120; // B
                } else {
                    // Ocean - dark gray
                    data[index] = 60;      // R
                    data[index + 1] = 65;  // G
                    data[index + 2] = 70;  // B
                }
                data[index + 3] = 255; // Alpha
            }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        
        // Add subtle cloud texture to background
        tempCtx.globalCompositeOperation = 'overlay';
        tempCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 3 + 1;
            tempCtx.beginPath();
            tempCtx.arc(x, y, size, 0, Math.PI * 2);
            tempCtx.fill();
        }
        
        this.satelliteBackground = tempCanvas;
    }

    init() {
        this.setupEvents();
        this.updateTimestamp();
        setInterval(() => this.updateTimestamp(), 1000);
        this.animate();
    }

    setupEvents() {
        this.audioBtn.addEventListener('click', () => this.toggleAudio());
        
        this.sensitivity.addEventListener('input', (e) => {
            this.sensitivityValue = parseFloat(e.target.value);
            this.sensValue.textContent = this.sensitivityValue.toFixed(1);
        });

        document.querySelectorAll('.hurricane-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelector('.hurricane-btn.active').classList.remove('active');
                e.target.classList.add('active');
                this.currentHurricane = e.target.dataset.hurricane;
                this.updateOverlayInfo();
            });
        });
    }

    toggleAudio() {
        if (!this.audioEnabled) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    this.audioContext = new AudioContext();
                    this.analyzer = this.audioContext.createAnalyser();
                    this.analyzer.fftSize = 1024;
                    this.analyzer.smoothingTimeConstant = 0.8;
                    
                    const source = this.audioContext.createMediaStreamSource(stream);
                    source.connect(this.analyzer);
                    this.microphone = stream;
                    this.audioEnabled = true;
                    
                    this.audioBtn.textContent = '🎤 Microphone ON';
                    this.audioBtn.classList.add('active');
                })
                .catch(() => alert('Microphone inaccessible'));
        } else {
            this.stopAudio();
        }
    }

    stopAudio() {
        if (this.microphone) {
            this.microphone.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.audioEnabled = false;
        this.audioLevel = 0;
        this.audioBtn.textContent = '🎤 Microphone OFF';
        this.audioBtn.classList.remove('active');
    }

    getAudioLevel() {
        if (!this.analyzer) return 0;
        
        const bufferLength = this.analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyzer.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        return (sum / bufferLength) / 255;
    }

    updateTimestamp() {
        const now = new Date();
        document.getElementById('timestamp').textContent = 
            `NOAA-20 VIIRS • TEMPS RÉEL • ${now.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
    }

    updateOverlayInfo() {
        const hurricane = this.hurricanes[this.currentHurricane];
        const overlay = document.getElementById('overlayInfo');
        overlay.innerHTML = `
            <div>${hurricane.name}</div>
            <div>${hurricane.coords}</div>
            <div>${hurricane.data}</div>
        `;
    }

    // Temperature to radar color (like your reference image)
    tempToRadarColor(intensity) {
        // Radar color scale: blue -> cyan -> green -> yellow -> orange -> red
        if (intensity < 0.1) return [0, 0, 0, 0]; // Transparent
        if (intensity < 0.2) return [0, 0, 255, Math.floor(intensity * 1000)]; // Blue
        if (intensity < 0.35) return [0, 200, 255, Math.floor(intensity * 700)]; // Cyan
        if (intensity < 0.5) return [0, 255, 150, Math.floor(intensity * 600)]; // Green-cyan
        if (intensity < 0.65) return [100, 255, 0, Math.floor(intensity * 500)]; // Green
        if (intensity < 0.8) return [255, 255, 0, Math.floor(intensity * 400)]; // Yellow
        if (intensity < 0.9) return [255, 150, 0, Math.floor(intensity * 300)]; // Orange
        return [255, 0, 0, Math.floor(intensity * 255)]; // Red
    }

    drawRealisticHurricane() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw satellite background
        this.ctx.drawImage(this.satelliteBackground, 0, 0);
        
        const audioInfluence = this.smoothedLevel * this.sensitivityValue;
        
        // Create hurricane spiral with realistic radar colors
        this.drawRadarSpiral(audioInfluence);
        
        // Draw eye
        this.drawEye(audioInfluence);
    }

    drawRadarSpiral(audioInfluence) {
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;
        
        // Create realistic hurricane spiral
        for (let x = 0; x < this.width; x += 2) {
            for (let y = 0; y < this.height; y += 2) {
                const dx = x - this.centerX;
                const dy = y - this.centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                if (distance > 15 && distance < this.maxRadius) {
                    // Spiral calculation
                    const spiralAngle = this.rotation + angle + Math.log(distance) * 0.4;
                    
                    // Create spiral arms
                    const armPhase = Math.sin(spiralAngle * 3) * 0.5 + 0.5;
                    const distanceFromCenter = Math.abs(distance - 80) / 100;
                    
                    // Intensity based on distance and spiral
                    let intensity = (1 - distanceFromCenter) * armPhase;
                    
                    // Add realistic noise
                    const noise1 = Math.sin(x * 0.05 + this.time) * Math.cos(y * 0.05);
                    const noise2 = Math.sin(distance * 0.1 + spiralAngle * 8) * 0.3;
                    intensity += (noise1 + noise2) * 0.2;
                    
                    // Eye wall enhancement
                    if (distance > 30 && distance < 80) {
                        intensity += 0.4;
                    }
                    
                    // Audio influence
                    intensity += audioInfluence * 0.3;
                    intensity = Math.max(0, Math.min(1, intensity));
                    
                    if (intensity > 0.15) {
                        const color = this.tempToRadarColor(intensity);
                        const index = (y * this.width + x) * 4;
                        
                        // Blend with existing pixel
                        const alpha = color[3] / 255;
                        data[index] = color[0] * alpha + data[index] * (1 - alpha);
                        data[index + 1] = color[1] * alpha + data[index + 1] * (1 - alpha);
                        data[index + 2] = color[2] * alpha + data[index + 2] * (1 - alpha);
                        data[index + 3] = Math.max(data[index + 3], color[3]);
                        
                        // Fill neighboring pixels for smoother look
                        if (x < this.width - 1 && y < this.height - 1) {
                            const index2 = ((y + 1) * this.width + (x + 1)) * 4;
                            data[index2] = data[index];
                            data[index2 + 1] = data[index + 1];
                            data[index2 + 2] = data[index + 2];
                            data[index2 + 3] = data[index + 3];
                        }
                    }
                }
            }
        }
        
        // Apply the radar overlay
        this.ctx.putImageData(imageData, 0, 0);
    }

    drawEye(audioInfluence) {
        const eyeRadius = 15 - audioInfluence * 5;
        
        // Dark eye center
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, eyeRadius
        );
        gradient.addColorStop(0, 'rgba(20, 20, 30, 0.9)');
        gradient.addColorStop(0.8, 'rgba(40, 40, 50, 0.7)');
        gradient.addColorStop(1, 'rgba(60, 60, 70, 0.2)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, eyeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye wall - bright ring
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 3 + audioInfluence * 5;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, eyeRadius + 8, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    animate() {
        this.time += 0.02;
        
        // Audio processing
        if (this.audioEnabled) {
            this.audioLevel = this.getAudioLevel();
            this.smoothedLevel = this.smoothedLevel * 0.85 + this.audioLevel * 0.15;
        } else {
            this.smoothedLevel *= 0.96;
        }

        // Rotation speed based on audio
        this.rotation += (0.01 + this.smoothedLevel * this.sensitivityValue * 0.03);

        // Update audio level bar
        this.levelBar.style.width = `${this.smoothedLevel * 100}%`;

        // Draw hurricane
        this.drawRealisticHurricane();

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
new RealisticSatelliteHurricane();