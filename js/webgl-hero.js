/* -------------------------------------------------------------
   TokenBounty.io - WebGL 3D Premium Hero Animation
   Uses Three.js to render futuristic white cables with gold tips
   that spread outward based on scroll position.
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    // Basic Setup
    const container = document.createElement("div");
    container.id = "webgl-container";
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.zIndex = "-1"; // Behind content
    container.style.pointerEvents = "none";
    document.body.prepend(container);

    const scene = new THREE.Scene();
    // Premium soft light grey/blue fog to blend with the background
    scene.fog = new THREE.FogExp2(0xf5f7fa, 0.002);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 0, 400);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Clear color is transparent so it blends with CSS background
    renderer.setClearColor(0x000000, 0); 
    container.appendChild(renderer.domElement);

    // Lighting (Studio Setup for premium look)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(200, 500, 300);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd97706, 0.5); // Warm gold rim light
    dirLight2.position.set(-200, -100, -200);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 500);
    pointLight.position.set(0, -100, 100);
    scene.add(pointLight);

    // Materials
    // Premium White Plastic/Silicone for the tubes
    const tubeMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.4,
        clearcoat: 0.8,
        clearcoatRoughness: 0.2,
    });

    // Glowing Gold for the tips
    const tipMaterial = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.5,
        metalness: 0.8,
        roughness: 0.2
    });

    // Create Tubes
    const numTubes = 45;
    const segments = 64;
    const tubeRadius = 0.8;
    const radialSegments = 8;
    
    // We will store reference to tube meshes and their target spread positions
    const cables = [];
    
    // The top anchor point where all cables originate (above the screen)
    const topAnchor = new THREE.Vector3(0, 300, 0);

    for (let i = 0; i < numTubes; i++) {
        // Random bottom position in a bundle when scroll = 0
        const startX = (Math.random() - 0.5) * 40;
        const startY = -100 + (Math.random() - 0.5) * 50;
        const startZ = (Math.random() - 0.5) * 40;
        
        // Target expanded position when scrolled down (a wide circle)
        const angle = (i / numTubes) * Math.PI * 2;
        const expandRadius = 250 + Math.random() * 50;
        const targetX = Math.cos(angle) * expandRadius;
        const targetY = -150 + Math.random() * 100; // Varying depths
        const targetZ = Math.sin(angle) * expandRadius;

        // Control points for the curve
        // CP1: close to top, CP2: middle, CP3: bottom
        const points = [
            topAnchor.clone(),
            new THREE.Vector3(startX * 0.2, 100, startZ * 0.2), // Mid point 1
            new THREE.Vector3(startX * 0.8, 0, startZ * 0.8),   // Mid point 2
            new THREE.Vector3(startX, startY, startZ)           // End point
        ];

        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, segments, tubeRadius, radialSegments, false);
        const mesh = new THREE.Mesh(geometry, tubeMaterial);
        
        // Add Gold Tip at the end of the tube
        const tipGeo = new THREE.SphereGeometry(tubeRadius * 2.5, 16, 16);
        const tipMesh = new THREE.Mesh(tipGeo, tipMaterial);
        tipMesh.position.copy(points[3]); // Place at end point
        scene.add(tipMesh);

        scene.add(mesh);
        
        cables.push({
            mesh: mesh,
            tipMesh: tipMesh,
            curve: curve,
            basePoints: points.map(p => p.clone()),
            targetVector: new THREE.Vector3(targetX, targetY, targetZ),
            randomOffset: Math.random() * Math.PI * 2,
            speed: 0.001 + Math.random() * 0.001
        });
    }

    // Scroll & Mouse Interaction Variables
    let targetScrollY = 0;
    let currentScrollY = 0;
    
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    window.addEventListener("scroll", () => {
        targetScrollY = window.scrollY;
    });

    window.addEventListener("mousemove", (event) => {
        // Normalize mouse coordinates from -1 to 1
        targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    let time = 0;

    function animate() {
        requestAnimationFrame(animate);

        time += 0.01;
        
        // Smooth interpolation for scroll
        currentScrollY += (targetScrollY - currentScrollY) * 0.05;
        // Scroll factor between 0 and 1 (1 = scrolled ~800px down)
        let scrollFactor = Math.min(currentScrollY / 800, 1.0);
        
        // Smooth interpolation for mouse
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;

        // Subtle camera pan based on mouse
        camera.position.x = mouseX * 20;
        camera.position.y = mouseY * 20;
        camera.lookAt(0, -50, 0);

        // Update each cable's geometry dynamically
        cables.forEach(cable => {
            // Calculate how much this cable should spread
            // Use an easing function so it starts slow and accelerates
            const ease = 1 - Math.pow(1 - scrollFactor, 3);
            
            // Add subtle floating animation (wind effect)
            const floatX = Math.sin(time + cable.randomOffset) * 10;
            const floatZ = Math.cos(time + cable.randomOffset * 1.5) * 10;

            // Interpolate bottom point between base bundle and target expanded circle
            const currentBottom = new THREE.Vector3().lerpVectors(
                cable.basePoints[3],
                cable.targetVector,
                ease
            );
            
            // Apply floating to the bottom
            currentBottom.x += floatX * (1 - ease * 0.5); // float less when expanded
            currentBottom.z += floatZ * (1 - ease * 0.5);

            // Update curve points
            cable.curve.points[3].copy(currentBottom);
            
            // Mid points also fan out slightly to create a smooth arch
            cable.curve.points[2].lerpVectors(
                cable.basePoints[2], 
                new THREE.Vector3(currentBottom.x * 0.6, currentBottom.y * 0.5, currentBottom.z * 0.6), 
                ease
            );
            cable.curve.points[1].lerpVectors(
                cable.basePoints[1], 
                new THREE.Vector3(currentBottom.x * 0.2, 100, currentBottom.z * 0.2), 
                ease
            );

            // Re-generate geometry (Performance note: in production, shaders are faster, but for 50 tubes this runs at 60fps)
            cable.mesh.geometry.dispose();
            cable.mesh.geometry = new THREE.TubeGeometry(cable.curve, segments, tubeRadius, radialSegments, false);
            
            // Update Tip Position
            cable.tipMesh.position.copy(currentBottom);
        });

        renderer.render(scene, camera);
    }

    animate();
});
