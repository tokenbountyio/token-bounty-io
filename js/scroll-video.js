/* -------------------------------------------------------------
   TokenBounty.io - 60 FPS Buttery Smooth Scroll Video (Canvas Cache)
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

    // 2. Setup Canvas for 60fps rendering
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.opacity = "1"; 
    bgWrapper.appendChild(canvas);
    
    const ctx = canvas.getContext("2d", { alpha: false });
    const frames = [];
    let isCacheReady = false;

    // Resizing
    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    // 3. Scroll state
    let targetProgress = 0;
    let smoothedProgress = 0;

    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
        if (maxScroll > 0) {
            targetProgress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
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
            drawHeight = ch;
            drawWidth = ch * imgRatio;
            offsetX = (cw - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = cw;
            drawHeight = cw / imgRatio;
            offsetX = 0;
            offsetY = (ch - drawHeight) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Animation Loop
    function renderLoop() {
        // Lerp progress for that "agency" smoothness
        smoothedProgress += (targetProgress - smoothedProgress) * 0.12;

        if (isCacheReady && frames.length > 0) {
            let frameIndex = Math.floor(smoothedProgress * (frames.length - 1));
            frameIndex = Math.max(0, Math.min(frameIndex, frames.length - 1));
            drawImageCover(frames[frameIndex]);
        }
        
        requestAnimationFrame(renderLoop);
    }
    
    requestAnimationFrame(renderLoop);

    // 4. The Magic: Fetch Video as Blob -> Extract Frames -> Render to Canvas
    // This is the ONLY way to get 60fps scrubbing without CPU decode lag
    async function initUltraSmoothScrubbing() {
        try {
            // Display loading state on canvas (optional, but good for UX)
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Fetch video into RAM
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const video = document.createElement("video");
            video.src = blobUrl;
            video.muted = true;
            video.playsInline = true;
            video.preload = "auto";
            
            // Wait for metadata
            await new Promise((resolve) => {
                video.addEventListener("loadedmetadata", resolve, { once: true });
            });
            
            const duration = video.duration || 5;
            const totalFrames = 80; // High frame count for buttery smoothness
            
            const extractCanvas = document.createElement("canvas");
            const exCtx = extractCanvas.getContext("2d", { willReadFrequently: true });
            
            // Limit resolution slightly for RAM safety, 960px width is plenty for background
            const targetWidth = Math.min(960, video.videoWidth);
            const targetHeight = (targetWidth / video.videoWidth) * video.videoHeight;
            extractCanvas.width = targetWidth;
            extractCanvas.height = targetHeight;

            // Extract frames
            for (let i = 0; i < totalFrames; i++) {
                const time = (i / (totalFrames - 1)) * (duration - 0.05);
                
                await new Promise((resolve) => {
                    const onSeeked = () => {
                        video.removeEventListener("seeked", onSeeked);
                        resolve();
                    };
                    video.addEventListener("seeked", onSeeked);
                    video.currentTime = time;
                });
                
                exCtx.drawImage(video, 0, 0, targetWidth, targetHeight);
                const bitmap = await createImageBitmap(extractCanvas);
                frames.push(bitmap);
                
                // Draw the first frame immediately so the screen isn't black
                if (i === 0) {
                    isCacheReady = true; 
                    drawImageCover(bitmap);
                }
            }
            
            // Cleanup
            URL.revokeObjectURL(blobUrl);
            video.remove();
            
        } catch (e) {
            console.error("Frame extraction failed:", e);
        }
    }

    initUltraSmoothScrubbing();
});
