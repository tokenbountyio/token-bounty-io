/* -------------------------------------------------------------
   TokenBounty.io - Scroll-Scrubbed Cinematic Video Background
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    const videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260729_102822_0e6c87e8-c141-4744-bf32-ad30db296371.mp4";
    const posterUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260728_050334_5b076e26-0ce7-4898-b432-d764190e448f.png"; // Placeholder poster

    // 1. Create the fixed background wrapper
    const bgWrapper = document.createElement("div");
    bgWrapper.id = "scroll-video-bg";
    bgWrapper.style.position = "fixed";
    bgWrapper.style.top = "0";
    bgWrapper.style.left = "0";
    bgWrapper.style.width = "100%";
    bgWrapper.style.height = "100%";
    bgWrapper.style.zIndex = "-2";
    bgWrapper.style.backgroundColor = "#0a0a0a"; // Fallback color
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

    // 2. Setup Canvas
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.opacity = "0"; // Fade in when ready
    canvas.style.transition = "opacity 0.5s ease";
    bgWrapper.appendChild(canvas);

    const ctx = canvas.getContext("2d", { alpha: false });
    
    // 3. Setup Video element for fallback/extraction
    const video = document.createElement("video");
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.crossOrigin = "anonymous";
    video.style.position = "absolute";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    bgWrapper.appendChild(video);

    // Frame cache state
    const frames = [];
    let isCacheReady = false;
    let videoDuration = 0;

    // Resizing
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // Scroll state
    let targetProgress = 0;
    let smoothedProgress = 0;
    // We want the video to finish scrubbing exactly when they hit the table section
    // Or just spread it across the entire page height.
    
    window.addEventListener("scroll", () => {
        // Calculate progress: 0 at top, 1 at bottom
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0) {
            targetProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
        }
    });

    // Draw object-cover
    function drawImageCover(img) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = window.innerWidth * dpr;
        const ch = window.innerHeight * dpr;
        
        const imgRatio = img.width / img.height;
        const canvasRatio = cw / ch;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgRatio > canvasRatio) {
            // Image is wider than canvas
            drawHeight = ch;
            drawWidth = ch * imgRatio;
            offsetX = (cw - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller than canvas
            drawWidth = cw;
            drawHeight = cw / imgRatio;
            offsetX = 0;
            offsetY = (ch - drawHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Animation Loop
    let lastSeekTime = -1;
    
    function renderLoop() {
        // Lerp progress
        smoothedProgress += (targetProgress - smoothedProgress) * 0.12;

        if (isCacheReady && frames.length > 0) {
            // Use cached ImageBitmaps
            let frameIndex = Math.floor(smoothedProgress * (frames.length - 1));
            frameIndex = Math.max(0, Math.min(frameIndex, frames.length - 1));
            drawImageCover(frames[frameIndex]);
        } else if (videoDuration > 0) {
            // Fallback: Seek video
            const seekTarget = smoothedProgress * (videoDuration - 0.05);
            // Only seek if delta is big enough to avoid lag
            if (Math.abs(video.currentTime - seekTarget) > 0.04) {
                video.currentTime = seekTarget;
            }
            // Draw current video frame to canvas just to be safe, though video element itself is visible
        }
        
        requestAnimationFrame(renderLoop);
    }
    
    renderLoop();

    // Frame Extraction Logic
    video.addEventListener("loadeddata", () => {
        videoDuration = video.duration || 5; // Default 5s if NaN
        
        // Yield shortly before starting extraction
        setTimeout(extractFrames, 300);
    });

    async function extractFrames() {
        try {
            // We'll extract 60 frames for smooth playback across scroll
            const totalFrames = 60; 
            const extractCanvas = document.createElement("canvas");
            const exCtx = extractCanvas.getContext("2d");
            
            // Limit extraction resolution for memory safety (max 960px width)
            const targetWidth = Math.min(960, video.videoWidth);
            const targetHeight = (targetWidth / video.videoWidth) * video.videoHeight;
            
            extractCanvas.width = targetWidth;
            extractCanvas.height = targetHeight;
            
            for (let i = 0; i < totalFrames; i++) {
                const time = (i / (totalFrames - 1)) * (videoDuration - 0.05);
                
                // Wait for video to seek
                await new Promise((resolve) => {
                    video.currentTime = time;
                    const onSeeked = () => {
                        video.removeEventListener("seeked", onSeeked);
                        resolve();
                    };
                    video.addEventListener("seeked", onSeeked);
                });
                
                exCtx.drawImage(video, 0, 0, targetWidth, targetHeight);
                const bitmap = await createImageBitmap(extractCanvas);
                frames.push(bitmap);
            }
            
            isCacheReady = true;
            canvas.style.opacity = "1";
            video.style.opacity = "0"; // Hide fallback video
            setTimeout(() => video.remove(), 600); // Remove video to save memory
            
        } catch (e) {
            console.warn("Frame extraction failed, using fallback seeking.", e);
            canvas.style.opacity = "0";
            video.style.opacity = "1";
        }
    }
});
