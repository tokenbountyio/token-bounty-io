/* -------------------------------------------------------------
   TokenBounty.io - 3D Interactive Web3 Canvas Engine
   Creates a premium neon-particle network background
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initArchitecture();
    initCanvasParticles();
});

function initArchitecture() {
    const archHTML = `
    <div class="arch-background" id="archBg"></div>
    <div class="arch-ceiling" id="archCeiling"></div>
    <div class="arch-pillar left" id="archPillarLeft"></div>
    <div class="arch-pillar right" id="archPillarRight"></div>
    <div class="arch-curve" id="archCurve"></div>
    `;
    document.body.insertAdjacentHTML('afterbegin', archHTML);

    // Parallax Scroll Animation
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        const pillarLeft = document.getElementById('archPillarLeft');
        const pillarRight = document.getElementById('archPillarRight');
        const ceiling = document.getElementById('archCeiling');
        const curve = document.getElementById('archCurve');

        if (pillarLeft) pillarLeft.style.transform = `translateY(${scrolled * -0.15}px)`;
        if (pillarRight) pillarRight.style.transform = `translateY(${scrolled * 0.1}px)`;
        if (ceiling) ceiling.style.transform = `translateY(${scrolled * 0.2}px)`;
        if (curve) curve.style.transform = `translateY(${scrolled * -0.05}px)`;
    });
}

function initCanvasParticles() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return; // Only run if canvas exists

    const ctx = canvas.getContext("2d");
    let width, height;
    let particles = [];
    
    // Config
    const particleCount = 70; // Adjust for density
    const maxDistance = 150; // Distance to draw lines
    const mouseRadius = 200; // Mouse interaction radius

    let mouse = {
        x: null,
        y: null,
        radius: mouseRadius
    };

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
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            // Mixed Neon Cyan and Neon Purple
            const isCyan = Math.random() > 0.5;
            this.color = isCyan ? 'rgba(0, 242, 254, 0.6)' : 'rgba(168, 85, 247, 0.6)';
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off edges
            if (this.x > width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > height || this.y < 0) this.speedY = -this.speedY;

            // Mouse Interaction (Push particles away slightly and slow them)
            if (mouse.x && mouse.y) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < mouse.radius) {
                    // Gentle push
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    const push = force * 1.5;
                    
                    this.x -= forceDirectionX * push;
                    this.y -= forceDirectionY * push;
                }
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
                    let opacity = 1 - (distance / maxDistance);
                    // Line color based on distance
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0, 242, 254, ${opacity * 0.15})`; // Subtle Cyan Links
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
            
            // Connect to mouse
            if (mouse.x && mouse.y) {
                let dx = particles[i].x - mouse.x;
                let dy = particles[i].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    let opacity = 1 - (distance / mouse.radius);
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(168, 85, 247, ${opacity * 0.3})`; // Purple Links to Mouse
                    ctx.lineWidth = 1.5;
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
