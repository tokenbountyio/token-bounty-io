/* -------------------------------------------------------------
   TokenBounty.io - Bulletproof Scroll-Scrubbed Video Background
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    const videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4";

    // 1. Create the fixed background wrapper
    const bgWrapper = document.createElement("div");
    bgWrapper.id = "scroll-video-bg";
    bgWrapper.style.position = "fixed";
    bgWrapper.style.top = "0";
    bgWrapper.style.left = "0";
    bgWrapper.style.width = "100%";
    bgWrapper.style.height = "100%";
    bgWrapper.style.zIndex = "-2";
    bgWrapper.style.backgroundColor = "#0a0a0a"; 
    bgWrapper.style.overflow = "hidden";
    bgWrapper.style.pointerEvents = "none";
    document.body.prepend(bgWrapper);

    // Make sure body content sits on top
    const allImmediateChildren = document.body.children;
    for(let i=0; i<allImmediateChildren.length; i++) {
        if(allImmediateChildren[i].id !== "scroll-video-bg" && allImmediateChildren[i].tagName !== "SCRIPT" && allImmediateChildren[i].tagName !== "STYLE") {
            allImmediateChildren[i].style.position = "relative";
            allImmediateChildren[i].style.zIndex = "10";
        }
    }

    // 2. Setup Video element directly (Canvas extract can fail due to CORS on CloudFront)
    const video = document.createElement("video");
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    // crossOrigin causes issues if Cloudfront isn't configured for it, so we don't use Canvas extraction fallback
    video.style.position = "absolute";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    bgWrapper.appendChild(video);

    // Force video to load its metadata
    video.load();

    // 3. Scroll state
    let targetProgress = 0;
    let smoothedProgress = 0;

    window.addEventListener("scroll", () => {
        // Calculate progress: 0 at top, 1 at bottom
        // We calculate maxScroll based on body to be absolutely safe
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = Math.max(
            document.body.scrollHeight, 
            document.documentElement.scrollHeight
        ) - window.innerHeight;
        
        if (maxScroll > 0) {
            targetProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
        }
    });

    // To prevent the browser from blocking video updates, we briefly play and pause it
    const initPlay = () => {
        video.play().then(() => {
            video.pause();
        }).catch(e => console.log("Autoplay blocked, safe to ignore for scrubbing"));
        window.removeEventListener("touchstart", initPlay);
        window.removeEventListener("click", initPlay);
    };
    window.addEventListener("touchstart", initPlay);
    window.addEventListener("click", initPlay);

    // 4. Animation Loop
    function renderLoop() {
        // Lerp progress for that "agency" smoothness
        smoothedProgress += (targetProgress - smoothedProgress) * 0.08;

        if (video.readyState >= 1) { // 1 = HAVE_METADATA
            const duration = video.duration || 5;
            const targetTime = smoothedProgress * (duration - 0.05); // slightly avoid the very last frame
            
            // Only update if there is a meaningful change to save CPU
            if (Math.abs(video.currentTime - targetTime) > 0.01) {
                video.currentTime = targetTime;
            }
        }
        
        requestAnimationFrame(renderLoop);
    }
    
    // Start loop
    requestAnimationFrame(renderLoop);
});
