/* -------------------------------------------------------------
   TokenBounty.io - 3D Interactive Web3 Canvas Engine
   Creates a premium neon-particle network background
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initArchitecture();
    initCanvasParticles();
});

function initArchitecture() {
    // Premium Grid already applied via CSS body. 
    // We only inject the animated canvas particles for subtle movement.
    const archHTML = `
    <canvas id="bg-canvas" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -4; pointer-events: none; opacity: 0.3;"></canvas>
    `;
    document.body.insertAdjacentHTML('afterbegin', archHTML);
}

function initCanvasParticles() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width, height;
    let particles = [];
    
    // Config for Elegant & Subtle Network
    const particleCount = 80; // Reduced for cleaner look
    const maxDistance = 150; 
    const mouseRadius = 200; // Normal interaction area

    let mouse = { x: null, y: null, radius: mouseRadius };

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    window.addEventListener("mouseout", () => {
        mouse.x = undefined;
        mouse.y = undefined;
    });

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseSize = Math.random() * 1.5 + 1;
            this.size = this.baseSize;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.baseSpeedX = this.speedX;
            this.baseSpeedY = this.speedY;
            
            // Theme colors: Soft Cyan, Soft Purple
            const rand = Math.random();
            if (rand > 0.5) {
                this.color = 'rgba(0, 242, 254, 0.4)'; 
                this.lineColor = '0, 242, 254';
            } else {
                this.color = 'rgba(168, 85, 247, 0.4)';
                this.lineColor = '168, 85, 247';
            }
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off edges smoothly
            if (this.x > width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > height || this.y < 0) this.speedY = -this.speedY;

            // Subtle Magnetic Mouse Interaction
            if (mouse.x && mouse.y) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    // Very gentle pull
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    
                    this.speedX += forceDirectionX * force * 0.05;
                    this.speedY += forceDirectionY * force * 0.05;
                    
                    // Subtle glow
                    this.size = Math.min(this.size + 0.05, this.baseSize * 1.5);
                } else {
                    if (this.size > this.baseSize) this.size -= 0.05;
                    this.speedX += (this.baseSpeedX - this.speedX) * 0.02;
                    this.speedY += (this.baseSpeedY - this.speedY) * 0.02;
                }
            } else {
                if (this.size > this.baseSize) this.size -= 0.05;
                this.speedX += (this.baseSpeedX - this.speedX) * 0.02;
                this.speedY += (this.baseSpeedY - this.speedY) * 0.02;
            }
            
            // Speed limit to keep it relaxing
            let speedMag = Math.sqrt(this.speedX*this.speedX + this.speedY*this.speedY);
            if(speedMag > 2) {
                this.speedX = (this.speedX / speedMag) * 2;
                this.speedY = (this.speedY / speedMag) * 2;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        // Clear canvas normally for crisp lines, no motion blur chaos
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Connect particles
            for (let j = i; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    let opacity = (1 - (distance / maxDistance)) * 0.25; // Soft opacity
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${particles[i].lineColor}, ${opacity})`; 
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
            
            // Connect to mouse gently
            if (mouse.x && mouse.y) {
                let dx = particles[i].x - mouse.x;
                let dy = particles[i].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius * 0.8) {
                    let opacity = (1 - (distance / (mouse.radius * 0.8))) * 0.3; // Very subtle
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${particles[i].lineColor}, ${opacity})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    init();
    animate();
}
