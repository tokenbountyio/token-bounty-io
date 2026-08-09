/* -------------------------------------------------------------
   TokenBounty.io - Interactive Web3 Scroll-Driven Silver Ring Engine
   Premium Light Theme
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.createElement("canvas");
    canvas.id = "heroParticlesCanvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "-1"; // Ensure it's behind everything
    canvas.style.opacity = "0.85";
    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initParticles();
    });

    let scrollY = 0;
    let targetScrollY = 0;
    
    window.addEventListener("scroll", () => {
        targetScrollY = window.scrollY;
    });

    const particles = [];
    const particleCount = 250;
    
    const mouse = { x: width / 2, y: height / 2 };
    let mouseActive = false;
    
    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouseActive = true;
    });
    window.addEventListener("mouseleave", () => {
        mouseActive = false;
    });

    function initParticles() {
        particles.length = 0;
        for (let i = 0; i < particleCount; i++) {
            // Distribute particles in a 3D ring shape (torus/sphere hybrid)
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = Math.random() * Math.PI * 2;
            const distance = 150 + Math.random() * 50; // Base radius
            
            particles.push({
                baseAngle1: angle1,
                baseAngle2: angle2,
                baseDistance: distance,
                speed: 0.002 + Math.random() * 0.003,
                size: Math.random() * 2 + 1,
                color: Math.random() > 0.8 ? 'rgba(217, 119, 6, 0.8)' : (Math.random() > 0.5 ? 'rgba(148, 163, 184, 0.9)' : 'rgba(255, 255, 255, 1)'), // Gold, Silver, White
                zOffset: (Math.random() - 0.5) * 100 // Depth
            });
        }
    }
    
    initParticles();

    let time = 0;

    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Smooth scroll interpolation
        scrollY += (targetScrollY - scrollY) * 0.1;
        time += 0.005;
        
        const centerX = width / 2;
        const centerY = height / 3; // Center slightly higher in hero

        // Calculate scroll expansion factor
        // The further you scroll, the wider the ring gets, creating the "frame" effect
        const scrollFactor = Math.min(scrollY / 800, 1.5); 
        const expansion = 1 + scrollFactor * 3.5;
        
        // Mouse tilt factor
        const tiltX = mouseActive ? (mouse.x - centerX) * 0.0005 : 0;
        const tiltY = mouseActive ? (mouse.y - centerY) * 0.0005 : 0;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            p.baseAngle1 += p.speed;
            
            // 3D Math for ring projection
            let x3d = Math.cos(p.baseAngle1) * (p.baseDistance * expansion) + Math.cos(p.baseAngle2) * 20;
            let y3d = Math.sin(p.baseAngle1) * (p.baseDistance * expansion * 0.4) + Math.sin(p.baseAngle2) * 20; // 0.4 flattens the ring
            let z3d = p.zOffset + Math.sin(p.baseAngle1) * 100;
            
            // Apply mouse tilt
            let rotatedX = x3d * Math.cos(tiltX) - z3d * Math.sin(tiltX);
            let rotatedZ = x3d * Math.sin(tiltX) + z3d * Math.cos(tiltX);
            
            let rotatedY = y3d * Math.cos(tiltY) - rotatedZ * Math.sin(tiltY);
            rotatedZ = y3d * Math.sin(tiltY) + rotatedZ * Math.cos(tiltY);

            // Perspective projection
            const fov = 800;
            const scale = fov / (fov + rotatedZ);
            
            const screenX = centerX + rotatedX * scale;
            const screenY = centerY + rotatedY * scale + scrollY * 0.4; // Parallax down slightly when scrolling

            // Draw particle as a glowing shard
            ctx.save();
            ctx.translate(screenX, screenY);
            
            // Shards are slightly elongated based on their angle to center
            const angleToCenter = Math.atan2(screenY - centerY, screenX - centerX);
            ctx.rotate(angleToCenter);
            
            ctx.beginPath();
            const rectWidth = p.size * scale * (2 + scrollFactor * 3); // Stretch shards as they explode
            const rectHeight = p.size * scale;
            
            ctx.rect(-rectWidth/2, -rectHeight/2, rectWidth, rectHeight);
            
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 15 * scale;
            ctx.shadowColor = p.color;
            ctx.fill();
            
            ctx.restore();
            
            // Optional: Draw connecting lines if not exploded
            if (scrollFactor < 0.3) {
                for (let j = i + 1; j < particles.length; j += 10) {
                    const p2 = particles[j];
                    // Approximate distance check to save CPU
                    if (Math.abs(p.baseAngle1 - p2.baseAngle1) < 0.2) {
                        const dist = Math.abs(p.baseDistance - p2.baseDistance);
                        if (dist < 40) {
                            ctx.beginPath();
                            // We need to calculate p2's screen pos (simplified for lines)
                            const x2 = centerX + Math.cos(p2.baseAngle1) * (p2.baseDistance * expansion) * scale;
                            const y2 = centerY + Math.sin(p2.baseAngle1) * (p2.baseDistance * expansion * 0.4) * scale;
                            
                            ctx.moveTo(screenX, screenY);
                            ctx.lineTo(x2, y2);
                            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * scale * (1 - scrollFactor*3)})`;
                            ctx.lineWidth = 0.5;
                            ctx.stroke();
                        }
                    }
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
});
