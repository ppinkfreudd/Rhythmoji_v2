class WarpBackground {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            beamsPerSide: options.beamsPerSide || 3,
            beamSize: options.beamSize || 5,
            beamDelayMax: options.beamDelayMax || 3,
            beamDelayMin: options.beamDelayMin || 0,
            beamDuration: options.beamDuration || 3,
            gridColor: options.gridColor || 'rgba(255, 255, 255, 0.1)'
        };
        this.init();
    }

    generateBeams() {
        const beams = [];
        const cellsPerSide = Math.floor(100 / this.options.beamSize);
        const step = cellsPerSide / this.options.beamsPerSide;

        for (let i = 0; i < this.options.beamsPerSide; i++) {
            const x = Math.floor(i * step);
            const delay = Math.random() * (this.options.beamDelayMax - this.options.beamDelayMin) + this.options.beamDelayMin;
            beams.push({ x, delay });
        }
        return beams;
    }

    createBeam(x, delay, side) {
        const beam = document.createElement('div');
        beam.className = 'beam';
        const hue = Math.floor(Math.random() * 360);
        const ar = Math.floor(Math.random() * 10) + 1;
        
        beam.style.setProperty('--x', `${x * this.options.beamSize}%`);
        beam.style.setProperty('--width', `${this.options.beamSize}%`);
        beam.style.setProperty('--aspect-ratio', ar);
        beam.style.setProperty('--background', `linear-gradient(hsl(${hue} 80% 60%), transparent)`);
        beam.style.setProperty('--delay', `${delay}s`);
        beam.style.setProperty('--duration', `${this.options.beamDuration}s`);
        
        return beam;
    }

    createSide(className) {
        const side = document.createElement('div');
        side.className = `warp-side ${className}`;
        side.style.background = `linear-gradient(90deg, ${this.options.gridColor} 0 1px, transparent 1px ${this.options.beamSize}%) 50% 50% / ${this.options.beamSize}% ${this.options.beamSize}%`;
        return side;
    }

    init() {
        // Create warp background container
        const warpBackground = document.createElement('div');
        warpBackground.className = 'warp-background';
        
        // Create sides
        const sides = ['top', 'bottom', 'left', 'right'];
        sides.forEach(sideName => {
            const side = this.createSide(sideName);
            const beams = this.generateBeams();
            beams.forEach(beam => {
                side.appendChild(this.createBeam(beam.x, beam.delay, sideName));
            });
            warpBackground.appendChild(side);
        });

        // Add the warp background to the container
        this.container.classList.add('warp-container');
        this.container.insertBefore(warpBackground, this.container.firstChild);
    }
} 