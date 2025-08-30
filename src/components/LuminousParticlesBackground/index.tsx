import React, { useRef, useEffect, useState } from 'react';
import { css } from '@linaria/core';

const backgroundStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1; /* Ensure it's behind other content */
`;

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
}

// Leaf image paths from FallingElements
const leafImagePaths = Array.from({ length: 16 }).map((_, i) => `/ragnarokmvptimer/assets/leaves/leaf${i + 1}.png`);

interface LeafParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRotation: number;
  size: number;
  image: HTMLImageElement;
  bounceCount: number; // New: track bounces
  maxBounces: number; // New: random threshold for disappearance
}

import { useSettings } from '../../contexts/SettingsContext'; // Import useSettings

// Helper function to convert hex color and alpha to rgba
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const LuminousParticlesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    backgroundEffectMode,
    particleDensity,
    particleColor,
    particleOpacity,
    waveAmplitude,
    waveColor,
    waveOpacity,
    particleEffect,
    animatedBackgroundColor, // New: for background color
    animatedBackgroundOpacity, // New: for background opacity
    isFallingElementsEnabled, // New: for falling leaves
    waveTrailColor, // New: for wave trail color
    waveTrailOpacity, // New: for wave trail opacity
  } = useSettings(); // Get settings from context

  const [leafImagesLoaded, setLeafImagesLoaded] = useState(false);
  const leafImageRefs = useRef<HTMLImageElement[]>([]);
  const waveHistory = useRef<Array<{ x: number; y: number }[]>>([]);
  const MAX_WAVE_HISTORY = 20;

  useEffect(() => {
    // Load leaf images
    const loadLeafImagePromises = leafImagePaths.map((path) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.error(`Failed to load leaf image: ${path}`);
          resolve(img); // Resolve even on error to not block loading
        };
      });
    });

    Promise.all(loadLeafImagePromises).then((loadedImages) => {
      leafImageRefs.current = loadedImages.filter(img => img.complete && img.naturalWidth > 0);
      setLeafImagesLoaded(true);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Determine number of particles based on density setting
    const getNumParticles = (density: 'low' | 'medium' | 'high') => {
      switch (density) {
        case 'low':
          return 50;
        case 'medium':
          return 100;
        case 'high':
          return 200;
        default:
          return 100;
      }
    };

    // Initialize particles
    const initParticles = () => {
      const newParticles: Particle[] = []; // Clear existing particles
      const currentNumParticles = getNumParticles(particleDensity); // Use setting
      for (let i = 0; i < currentNumParticles; i++) {
        newParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1, // Random radius between 1 and 4
          color: particleColor, // Use setting
          vx: (Math.random() - 0.5) * 0.5, // Random velocity between -0.25 and 0.25
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
      return newParticles;
    };

    let particles = initParticles();

    // Initialize leaf particles
    const initLeafParticles = () => {
      const newLeafParticles: LeafParticle[] = [];
      if (isFallingElementsEnabled && leafImageRefs.current.length > 0) {
        for (let i = 0; i < 30; i++) { // Fixed count for now, can be made configurable
          const randomImage = leafImageRefs.current[Math.floor(Math.random() * leafImageRefs.current.length)];
          newLeafParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.5 - canvas.height * 0.5, // Start above viewport
            vx: (Math.random() - 0.5) * 0.2, // Slower horizontal drift
            vy: Math.random() * 0.5 + 0.5, // Initial vertical velocity
            rotation: Math.random() * 360,
            vRotation: Math.random() * 1 - 0.5, // Slower rotational velocity
            size: Math.random() * 30 + 20, // Size between 20px and 50px
            image: randomImage,
            bounceCount: 0, // Initialize bounce count
            maxBounces: Math.floor(Math.random() * 3) + 3, // Random 3, 4, or 5 bounces
          });
        }
      }
      return newLeafParticles;
    };

    let leafParticles = initLeafParticles();

    // Set canvas dimensions and initialize particles on resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = initParticles(); // Re-initialize particles on resize
      leafParticles = initLeafParticles(); // Re-initialize leaf particles on resize
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial setup

    const animate = () => {
      // Clear canvas with a slight fade effect for trails
      ctx.fillStyle = hexToRgba(animatedBackgroundColor, animatedBackgroundOpacity);
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let drawAreaStartY = 0;
      let drawAreaEndY = canvas.height;
      let waveBaseY = canvas.height * 0.7; // Default for full

      if (backgroundEffectMode === 'top') {
        drawAreaEndY = canvas.height / 2;
        waveBaseY = canvas.height * 0.25;
      } else if (backgroundEffectMode === 'bottom') {
        drawAreaStartY = canvas.height / 2;
        waveBaseY = canvas.height * 0.75;
      } else if (backgroundEffectMode === 'center') {
        drawAreaStartY = canvas.height * 0.25;
        drawAreaEndY = canvas.height * 0.75;
        waveBaseY = canvas.height / 2;
      }

      // --- Wave-like movement (XMB style) ---
      const currentWavePoints: { x: number; y: number }[] = [];
      ctx.beginPath();
      ctx.moveTo(0, waveBaseY);
      for (let i = 0; i < canvas.width; i++) {
        const waveY =
          waveBaseY +
          Math.sin(i * 0.005 + Date.now() * 0.0005) * (waveAmplitude / 2) +
          Math.cos(i * 0.01 + Date.now() * 0.0003) * (waveAmplitude / 4);
        ctx.lineTo(i, waveY);
        currentWavePoints.push({ x: i, y: waveY });
      }
      // Add current wave points to history
      waveHistory.current.unshift(currentWavePoints);
      if (waveHistory.current.length > MAX_WAVE_HISTORY) {
        waveHistory.current.pop(); // Remove oldest
      }

      // Draw wave trail
      if (waveHistory.current.length > 1) {
        for (let i = 0; i < waveHistory.current.length - 1; i++) {
          const currentSegment = waveHistory.current[i];
          const nextSegment = waveHistory.current[i + 1];

          if (!currentSegment || !nextSegment) continue;

          // Calculate opacity for this segment (fades out)
          const segmentOpacity = waveTrailOpacity * (1 - (i / MAX_WAVE_HISTORY));
          ctx.fillStyle = hexToRgba(waveTrailColor, segmentOpacity);

          ctx.beginPath();
          ctx.moveTo(currentSegment[0].x, currentSegment[0].y);
          for (let j = 1; j < canvas.width; j++) {
            ctx.lineTo(currentSegment[j].x, currentSegment[j].y);
          }
          // Connect to the next segment to form a filled ribbon
          for (let j = canvas.width - 1; j >= 0; j--) {
            ctx.lineTo(nextSegment[j].x, nextSegment[j].y);
          }
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.strokeStyle = waveColor; // Use waveColor
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- Update and draw sparkling/glittering particles ---
      particles.forEach((particle, index) => {
        if (particleEffect === 'gravity') {
          // Add gravity
          particle.vy += 0.05;

          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wave collision
          const waveY =
            waveBaseY +
            Math.sin(particle.x * 0.005 + Date.now() * 0.0005) *
              (waveAmplitude / 2) +
            Math.cos(particle.x * 0.01 + Date.now() * 0.0003) *
              (waveAmplitude / 4);

          if (particle.y + particle.radius > waveY) {
            particle.y = waveY - particle.radius;
            particle.vy *= -0.6; // Bounce with damping
          }

          // Wrap around edges (for x-axis)
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;

          // Particle-particle collision (simple removal)
          for (let j = index + 1; j < particles.length; j++) {
            const otherParticle = particles[j];
            const dx = otherParticle.x - particle.x;
            const dy = otherParticle.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < particle.radius + otherParticle.radius) {
              // On collision, remove both particles
              particles.splice(j, 1);
              particles.splice(index, 1);
            }
          }
        } else {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;
        }

        // Only draw particles within the selected mode's area
        if (particle.y >= drawAreaStartY && particle.y <= drawAreaEndY) {
          // Draw particle
          ctx.fillStyle = particle.color;
          ctx.shadowBlur = particle.radius * 2; // Glow based on radius
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- Update and draw leaf particles ---
      if (isFallingElementsEnabled && leafImagesLoaded) {
        // Filter out leaves that have bounced too many times
        leafParticles = leafParticles.filter(leaf => leaf.bounceCount <= leaf.maxBounces);

        leafParticles.forEach((leaf, index) => {
          // Apply gravity
          leaf.vy += 0.05; // Adjust gravity as needed

          // Update position
          leaf.x += leaf.vx;
          leaf.y += leaf.vy;
          leaf.rotation += leaf.vRotation; // Apply rotation

          // Wave collision (similar to gravity particles)
          const waveY =
            waveBaseY +
            Math.sin(leaf.x * 0.005 + Date.now() * 0.0005) *
              (waveAmplitude / 2) +
            Math.cos(leaf.x * 0.01 + Date.now() * 0.0003) *
              (waveAmplitude / 4);

          if (leaf.y + leaf.size / 2 > waveY) { // Collision with center of leaf
            if (leaf.vy > 0) { // Only count bounce if moving downwards
              leaf.y = waveY - leaf.size / 2; // Position above wave
              leaf.vy *= -0.6; // Bounce with damping
              leaf.vx *= 0.9; // Reduce horizontal velocity on bounce
              leaf.bounceCount++; // Increment bounce count
            }
          }

          // Reset if falls off screen (and not due to bounce count)
          if (leaf.y > canvas.height + leaf.size) {
            // Reset leaf to top, effectively respawning it
            leaf.y = -leaf.size; 
            leaf.x = Math.random() * canvas.width;
            leaf.vy = Math.random() * 0.5 + 0.5;
            leaf.rotation = Math.random() * 360;
            leaf.vRotation = Math.random() * 1 - 0.5;
            leaf.vx = (Math.random() - 0.5) * 0.2;
            leaf.bounceCount = 0; // Reset bounce count for new fall
            leaf.maxBounces = Math.floor(Math.random() * 3) + 3; // New random max bounces
          }

          // Draw leaf
          ctx.save();
          ctx.translate(leaf.x + leaf.size / 2, leaf.y + leaf.size / 2);
          ctx.rotate(leaf.rotation * Math.PI / 180);
          ctx.drawImage(leaf.image, -leaf.size / 2, -leaf.size / 2, leaf.size, leaf.size);
          ctx.restore();
        });

        // Continuous spawning of leaves
        const desiredLeafCount = 30; // This can be made configurable later
        if (leafParticles.length < desiredLeafCount) {
          const leavesToSpawn = desiredLeafCount - leafParticles.length;
          for (let i = 0; i < leavesToSpawn; i++) {
            const randomImage = leafImageRefs.current[Math.floor(Math.random() * leafImageRefs.current.length)];
            leafParticles.push({
              x: Math.random() * canvas.width,
              y: -Math.random() * canvas.height * 0.5, // Start above viewport, spread out
              vx: (Math.random() - 0.5) * 0.2,
              vy: Math.random() * 0.5 + 0.5,
              rotation: Math.random() * 360,
              vRotation: Math.random() * 1 - 0.5,
              size: Math.random() * 30 + 20,
              image: randomImage,
              bounceCount: 0,
              maxBounces: Math.floor(Math.random() * 3) + 3,
            });
          }
        }
      }

      ctx.shadowBlur = 0; // Reset shadow after drawing all particles

      // Respawn particles if needed
      if (particleEffect === 'gravity') {
        const currentNumParticles = getNumParticles(particleDensity);
        if (particles.length < currentNumParticles) {
          for (let i = 0; i < currentNumParticles - particles.length; i++) {
            particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * drawAreaEndY,
              radius: Math.random() * 3 + 1,
              color: particleColor,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
            });
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [
    backgroundEffectMode,
    particleDensity,
    particleColor,
    waveAmplitude,
    waveColor,
    particleEffect,
    isFallingElementsEnabled, // Add dependency
    animatedBackgroundColor,
    animatedBackgroundOpacity, // Add dependency
    leafImagesLoaded, // Add dependency
    waveTrailColor, // New dependency
    waveTrailOpacity, // New dependency
  ]);

  return <canvas ref={canvasRef} className={backgroundStyles} />;
};

export default LuminousParticlesBackground;
