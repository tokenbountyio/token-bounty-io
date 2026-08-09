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
    
    // Config for the Crazy Magnetic Network
    const particleCount = 120; // Increased for a denser web
    const maxDistance = 140; 
    const mouseRadius = 250; // Larger interaction area

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
            this.baseSize = Math.random() * 2 + 1;
            this.size = this.baseSize;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.baseSpeedX = this.speedX;
            this.baseSpeedY = this.speedY;
            
            // Theme colors: Neon Cyan, Neon Purple, and a touch of Gold
            const rand = Math.random();
            if (rand > 0.66) {
                this.color = 'rgba(0, 242, 254, 0.8)'; // Cyan
                this.lineColor = '0, 242, 254';
            } else if (rand > 0.33) {
                this.color = 'rgba(168, 85, 247, 0.8)'; // Purple
                this.lineColor = '168, 85, 247';
            } else {
                this.color = 'rgba(250, 204, 21, 0.8)'; // Gold
                this.lineColor = '250, 204, 21';
            }
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off edges with damping
            if (this.x > width || this.x < 0) this.speedX = -this.speedX * 0.8;
            if (this.y > height || this.y < 0) this.speedY = -this.speedY * 0.8;

            // Crazy Magnetic Mouse Interaction
            if (mouse.x && mouse.y) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    // Magnetic pull (Gravity well)
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    
                    // Acceleration towards mouse
                    this.speedX += forceDirectionX * force * 0.6;
                    this.speedY += forceDirectionY * force * 0.6;
                    
                    // Grow in size when energized by mouse
                    this.size = Math.min(this.size + 0.2, this.baseSize * 3);
                } else {
                    // Return to normal size
                    if (this.size > this.baseSize) this.size -= 0.1;
                    
                    // Slowly return to base speed
                    this.speedX += (this.baseSpeedX - this.speedX) * 0.05;
                    this.speedY += (this.baseSpeedY - this.speedY) * 0.05;
                }
            } else {
                if (this.size > this.baseSize) this.size -= 0.1;
                this.speedX += (this.baseSpeedX - this.speedX) * 0.05;
                this.speedY += (this.baseSpeedY - this.speedY) * 0.05;
            }
            
            // Friction/Speed limit to prevent them from flying off to infinity
            let speedMag = Math.sqrt(this.speedX*this.speedX + this.speedY*this.speedY);
            if(speedMag > 6) {
                this.speedX = (this.speedX / speedMag) * 6;
                this.speedY = (this.speedY / speedMag) * 6;
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
        // Slight trail effect by using semi-transparent fill instead of clearRect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; 
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Connect particles
            for (let j = i; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    let opacity = (1 - (distance / maxDistance)) * 0.5;
                    ctx.beginPath();
                    // Blend colors based on particle i
                    ctx.strokeStyle = \`rgba(\${particles[i].lineColor}, \${opacity})\`; 
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
            
            // Laser thick connections to mouse
            if (mouse.x && mouse.y) {
                let dx = particles[i].x - mouse.x;
                let dy = particles[i].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius * 0.6) {
                    let opacity = 1 - (distance / (mouse.radius * 0.6));
                    ctx.beginPath();
                    ctx.strokeStyle = \`rgba(\${particles[i].lineColor}, \${opacity * 0.8})\`;
                    ctx.lineWidth = 2;
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
