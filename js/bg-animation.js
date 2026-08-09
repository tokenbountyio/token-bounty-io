/* -------------------------------------------------------------
   TokenBounty.io - Ultra Premium Architectural Parallax Background
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Create the fixed background wrapper
    const bgWrapper = document.createElement("div");
    bgWrapper.id = "arch-bg-wrapper";
    bgWrapper.style.position = "fixed";
    bgWrapper.style.top = "0";
    bgWrapper.style.left = "0";
    bgWrapper.style.width = "100%";
    bgWrapper.style.height = "100vh";
    bgWrapper.style.zIndex = "-2";
    bgWrapper.style.backgroundColor = "#F5F7FA"; 
    bgWrapper.style.overflow = "hidden";
    bgWrapper.style.pointerEvents = "none";
    document.body.prepend(bgWrapper);

    // 2. Create the image layer that will scale and pan
    const bgImage = document.createElement("img");
    bgImage.src = "/images/bg-arch.png";
    bgImage.style.position = "absolute";
    // Make it slightly larger than the screen so we can pan/parallax without showing edges
    bgImage.style.top = "-5%";
    bgImage.style.left = "-5%";
    bgImage.style.width = "110%";
    bgImage.style.height = "115%";
    bgImage.style.objectFit = "cover";
    // Transition for smooth breathing/ken-burns if we wanted purely CSS, 
    // but we'll use JS for parallax
    bgWrapper.appendChild(bgImage);

    // 3. Make sure body content sits on top and has relative positioning
    const allImmediateChildren = document.body.children;
    for(let i = 0; i < allImmediateChildren.length; i++) {
        const el = allImmediateChildren[i];
        if(el.id !== "arch-bg-wrapper" && el.tagName !== "SCRIPT" && el.tagName !== "STYLE") {
            el.style.position = "relative";
            el.style.zIndex = "10";
        }
    }

    // 4. Animation Engine (Parallax & Breathing)
    let scrollY = 0;
    let targetScrollY = 0;
    
    // Slow breathing (scale)
    let time = 0;

    window.addEventListener("scroll", () => {
        targetScrollY = window.scrollY || window.pageYOffset;
    });

    function renderLoop() {
        // Smooth lerp for parallax
        scrollY += (targetScrollY - scrollY) * 0.1;
        time += 0.002; // Very slow time for breathing
        
        // Calculate Parallax Y offset
        // When scrolled down 1000px, image moves up by maybe 150px
        const yOffset = -(scrollY * 0.15);
        
        // Calculate Breathing Scale (between 1.0 and 1.05)
        const scale = 1.0 + (Math.sin(time) + 1) * 0.025;
        
        // Apply transform
        bgImage.style.transform = `translate3d(0px, ${yOffset}px, 0px) scale(${scale})`;
        
        requestAnimationFrame(renderLoop);
    }
    
    // Start animation
    requestAnimationFrame(renderLoop);
});
