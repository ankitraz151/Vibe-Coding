/* Particle system for hero background */
class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 120 };
    this.resize();
    this.init();
    this.animate();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    window.addEventListener('mouseleave', () => { this.mouse.x = null; this.mouse.y = null; });
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 14000);
    for (let i = 0; i < count; i++) this.particles.push(this.createParticle());
  }

  createParticle() {
    const palette = [
      'rgba(134,163,64,',   // --clr-primary
      'rgba(201,168,76,',   // --clr-gold
      'rgba(100,130,50,',
      'rgba(80,100,40,',
    ];
    const color = palette[Math.floor(Math.random() * palette.length)];
    const size  = Math.random() * 2.2 + 0.4;
    return {
      x:    Math.random() * this.canvas.width,
      y:    Math.random() * this.canvas.height,
      vx:   (Math.random() - 0.5) * 0.35,
      vy:   (Math.random() - 0.5) * 0.35,
      size,
      baseSize: size,
      color,
      alpha: Math.random() * 0.5 + 0.1,
      targetAlpha: Math.random() * 0.5 + 0.1,
    };
  }

  drawConnections() {
    const maxDist = 140;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.12;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(134,163,64,${opacity})`;
          this.ctx.lineWidth = 0.6;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawConnections();

    for (const p of this.particles) {
      // Mouse repulsion
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;
        }
      }

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;

      // Twinkle
      p.alpha += (p.targetAlpha - p.alpha) * 0.02;
      if (Math.abs(p.alpha - p.targetAlpha) < 0.01) p.targetAlpha = Math.random() * 0.5 + 0.1;

      // Draw
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + p.alpha + ')';
      this.ctx.fill();

      // Glow for bright particles
      if (p.alpha > 0.45) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color + (p.alpha * 0.15) + ')';
        this.ctx.fill();
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}
