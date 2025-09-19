import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";




gsap.registerPlugin(ScrollTrigger);

document.addEventListener("DOMContentLoaded", () => {
  if (window.innerWidth >= 900) {
    const lenis = new Lenis();
    const videoContainer = document.querySelector(".video-container-desktop");
    const videoTitleElements = document.querySelectorAll(".video-title p");

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    const breakpoints = [
      { maxWidth: 1000, translateY: -135, movMultiplier: 450 },
      { maxWidth: 1100, translateY: -130, movMultiplier: 500 },
      { maxWidth: 1200, translateY: -125, movMultiplier: 550 },
      { maxWidth: 1300, translateY: -120, movMultiplier: 600 },
    ];

    const getInitialValues = () => {
      const width = window.innerWidth;

      for (const bp of breakpoints) {
        if (width <= bp.maxWidth) {
          return {
            translateY: bp.translateY,
            movementMultiplier: bp.movMultiplier,
          };
        }
      }

      return {
        translateY: -105,
        movementMultiplier: 650,
      };
    };

    const initialValues = getInitialValues();

    const animationState = {
      scrollProgress: 0,
      initialTranslateY: initialValues.translateY,
      currentTranslateY: initialValues.translateY,
      movementMultiplier: initialValues.movementMultiplier,
      scale: 0.25,
      fontSize: 80,
      gap: 2,
      targetMouseX: 0,
      currentMouseX: 0,
    };

    window.addEventListener("resize", () => {
      const newValues = getInitialValues();
      animationState.initialTranslateY = newValues.translateY;
      animationState.movementMultiplier = newValues.movementMultiplier;

      if (animationState.scrollProgress === 0) {
        animationState.currentTranslateY = newValues.translateY;
      }
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: ".intro",
        start: "top bottom",
        end: "top 10%",
        scrub: true,
        onUpdate: (self) => {
          animationState.scrollProgress = self.progress;

          animationState.currentTranslateY = gsap.utils.interpolate(
            animationState.initialTranslateY,
            0,
            animationState.scrollProgress
          );

          animationState.scale = gsap.utils.interpolate(
            0.25,
            1,
            animationState.scrollProgress
          );

          animationState.gap = gsap.utils.interpolate(
            2,
            1,
            animationState.scrollProgress
          );

          if (animationState.scrollProgress <= 0.4) {
            const firstPartProgress = animationState.scrollProgress / 0.4;
            animationState.fontSize = gsap.utils.interpolate(
              80,
              40,
              firstPartProgress
            );
          } else {
            const secondPartProgress =
              (animationState.scrollProgress - 0.4) / 0.6;
            animationState.fontSize = gsap.utils.interpolate(
              40,
              20,
              secondPartProgress
            );
          }
        },
      },
    });

    document.addEventListener("mousemove", (e) => {
      animationState.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    });

    const animate = () => {
      if (window.innerWidth < 900) return;

      const {
        scale,
        targetMouseX,
        currentMouseX,
        currentTranslateY,
        fontSize,
        gap,
        movementMultiplier,
      } = animationState;

      const scaledMovementMultiplier = (1 - scale) * movementMultiplier;

      const maxHorizontalMovement =
        scale < 0.95 ? targetMouseX * scaledMovementMultiplier : 0;

      animationState.currentMouseX = gsap.utils.interpolate(
        currentMouseX,
        maxHorizontalMovement,
        0.05
      );

      videoContainer.style.transform = `translateY(${currentTranslateY}%) translateX(${animationState.currentMouseX}px) scale(${scale})`;

      videoContainer.style.gap = `${gap}em`;

      videoTitleElements.forEach((element) => {
        element.style.fontSize = `${fontSize}px`;
      });

      requestAnimationFrame(animate);
    };

    animate();
  }
});
/*services*/ 
const canvases = document.querySelectorAll(".webgl-canvas");
const textureLoader = new THREE.TextureLoader();

canvases.forEach((canvas) => {
    // Get image URL from data attribute
    const imageUrl = canvas.getAttribute("data-image");

    // Set up Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    // Load texture
    const texture = textureLoader.load(imageUrl);

    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Shader material for ripple effect
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uHover: { value: 0 },
            uRippleStrength: { value: 0.1 },
            uRippleSpeed: { value: 1.0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uTime;
          uniform vec2 uMouse;
          uniform float uHover;
          uniform float uRippleStrength;
          uniform float uRippleSpeed;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;
            // Calculate distance from mouse position
            float dist = distance(uv, uMouse);
            // Create ripple effect based on distance and time
            float ripple = sin(dist * 10.0 - uTime * uRippleSpeed) * uHover * uRippleStrength;
            // Distort UV coordinates
            uv += ripple * 0.05;
            // Sample texture with distorted UVs
            vec4 color = texture2D(uTexture, uv);
            gl_FragColor = color;
          }
        `,
    });

    // Create mesh and add to scene
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        material.uniforms.uTime.value += 0.05;
        renderer.render(scene, camera);
    }
    animate();

    // Mouse position tracking
    let mouse = new THREE.Vector2(0, 0);
    canvas.addEventListener("mousemove", (event) => {
        // Get canvas bounding box
        const rect = canvas.getBoundingClientRect();
        // Normalize mouse coordinates to [0, 1] for shader
        mouse.x = (event.clientX - rect.left) / rect.width;
        mouse.y = 1 - (event.clientY - rect.top) / rect.height;
        material.uniforms.uMouse.value.set(mouse.x, mouse.y);
    });

    // Hover effect with GSAP
    canvas.addEventListener("mouseenter", () => {
        gsap.to(material.uniforms.uHover, {
            value: 1,
            duration: 0.5,
            ease: "power2.out",
        });
    });

    canvas.addEventListener("mouseleave", () => {
        gsap.to(material.uniforms.uHover, {
            value: 0,
            duration: 0.5,
            ease: "power2.out",
        });
    });

    // Handle canvas resize
    window.addEventListener("resize", () => {
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
});


/*menu*/ 
const menuContainer = document.querySelector('.menu-container');
const menuOverlay = menuContainer.querySelector('.menu-overlay');
const menuLinksHolders = menuContainer.querySelectorAll('.menu-link-item-holder');
const menuOpenBtn = menuContainer.querySelector('.menu-open');
const menuCloseBtn = menuContainer.querySelectorAll('.menu-close, .menu-close-icon');

// Timeline GSAP
const tl = gsap.timeline({ paused: true });
gsap.set(menuLinksHolders, { y: 75 });

tl.to(menuOverlay, {
  duration: 1.25,
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  ease: "power4.inOut"
}).to(menuLinksHolders, {
  y: 0,
  duration: 1,
  stagger: 0.1,
  ease: "power4.out",
  delay: -0.75
});

// Abrir menú
menuOpenBtn.addEventListener('click', () => {
  document.body.style.overflow = 'hidden'; // bloquea scroll
  tl.play();
});

// Cerrar menú
menuCloseBtn.forEach(btn => btn.addEventListener('click', () => {
  tl.reverse();
  document.body.style.overflow = 'auto'; // reactiva scroll
}));

// Cerrar al click en link
menuLinksHolders.forEach(holder => {
  holder.addEventListener('click', () => {
    tl.reverse();
    document.body.style.overflow = 'auto';
  });
});
