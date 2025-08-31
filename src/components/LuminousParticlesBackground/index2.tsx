import React, { useRef, useEffect, useState } from 'react';
import { css } from '@linaria/core';

const backgroundStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
`;

// Updated Particle interface to include isAlive for object pooling
interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  isAlive: boolean;
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
  isAlive: boolean; // Added for object pooling
}

import { useSettings } from '../../contexts/SettingsContext';

// Helper function to convert hex color and alpha to rgba
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const LuminousParticlesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    backgroundEffectMode,
    particleDensity,
    particleColor,
    particleOpacity,
    waveAmplitude,
    waveColor,
    waveOpacity,
    particleEffect,
    animatedBackgroundColor,
    animatedBackgroundOpacity,
    isFallingElementsEnabled,
    waveTrailColor,
    waveTrailOpacity,
  } = useSettings();

  const [leafImagesLoaded, setLeafImagesLoaded] = useState(false);
  const leafImageRefs = useRef<HTMLImageElement[]>([]);
  const waveHistory = useRef<Array<{ x: number; y: number }[]>>([]);
  const MAX_WAVE_HISTORY = 50;

  useEffect(() => {
    // Load leaf images
    const loadLeafImagePromises = leafImagePaths.map((path) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = path;
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.error(`Failed to load leaf image: ${path}`);
          resolve(img);
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

    // Setup offscreen canvas for background layers
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreenCanvas = offscreenCanvasRef.current;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;

    // Determine number of particles based on density setting
    const getNumParticles = (density: 'low' | 'medium' | 'high' | 'Empty') => {
      switch (density) {
        case 'Empty':
          return 0;
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

    const initParticles = () => {
      const newParticles: Particle[] = [];
      const currentNumParticles = getNumParticles(particleDensity);
      for (let i = 0; i < currentNumParticles; i++) {
        newParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1,
          color: particleColor,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          isAlive: true,
        });
      }
      return newParticles;
    };

    let particles = initParticles();

    const initLeafParticles = () => {
      const newLeafParticles: LeafParticle[] = [];
      if (isFallingElementsEnabled && leafImageRefs.current.length > 0) {
        for (let i = 0; i < 30; i++) {
          const randomImage = leafImageRefs.current[Math.floor(Math.random() * leafImageRefs.current.length)];
          newLeafParticles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.5 - canvas.height * 0.5,
            vx: (Math.random() - 0.5) * 0.2,
            vy: Math.random() * 0.5 + 0.5,
            rotation: Math.random() * 360,
            vRotation: Math.random() * 1 - 0.5,
            size: Math.random() * 30 + 20,
            image: randomImage,
            bounceCount: 0,
            maxBounces: Math.floor(Math.random() * 3) + 3,
            isAlive: true,
          });
        }
      }
      return newLeafParticles;
    };

    let leafParticles = initLeafParticles();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      offscreenCanvas.width = window.innerWidth;
      offscreenCanvas.height = window.innerHeight;
      particles = initParticles();
      leafParticles = initLeafParticles();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const animate = () => {
      // Clear main canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // --- Draw background and wave trail to offscreen canvas ---
      offscreenCtx.fillStyle = hexToRgba(animatedBackgroundColor, animatedBackgroundOpacity);
      offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

      let drawAreaStartY = 0;
      let drawAreaEndY = canvas.height;
      let waveBaseY = canvas.height * 0.7;

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
      offscreenCtx.beginPath();
      offscreenCtx.moveTo(0, waveBaseY);
      for (let i = 0; i < canvas.width; i++) {
        const waveY =
          waveBaseY +
          Math.sin(i * 0.005 + Date.now() * 0.0005) * (waveAmplitude / 2) +
          Math.cos(i * 0.01 + Date.now() * 0.0003) * (waveAmplitude / 4);
        offscreenCtx.lineTo(i, waveY);
        currentWavePoints.push({ x: i, y: waveY });
      }

      waveHistory.current.unshift(currentWavePoints);
      if (waveHistory.current.length > MAX_WAVE_HISTORY) {
        waveHistory.current.pop();
      }

      if (waveHistory.current.length > 1) {
        for (let i = 0; i < waveHistory.current.length - 1; i++) {
          const currentSegment = waveHistory.current[i];
          const nextSegment = waveHistory.current[i + 1];

          if (!currentSegment || !nextSegment) continue;

          const segmentOpacity = waveTrailOpacity * (1 - (i / MAX_WAVE_HISTORY));
          offscreenCtx.fillStyle = hexToRgba(waveTrailColor, segmentOpacity);

          offscreenCtx.beginPath();
          offscreenCtx.moveTo(currentSegment[0].x, currentSegment[0].y);
          for (let j = 1; j < canvas.width; j++) {
            offscreenCtx.lineTo(currentSegment[j].x, currentSegment[j].y);
          }
          for (let j = canvas.width - 1; j >= 0; j--) {
            offscreenCtx.lineTo(nextSegment[j].x, nextSegment[j].y);
          }
          offscreenCtx.closePath();
          offscreenCtx.fill();
        }
      }

      offscreenCtx.strokeStyle = waveColor;
      offscreenCtx.lineWidth = 1;
      offscreenCtx.stroke();

      // Draw the offscreen canvas content to the main canvas
      ctx.drawImage(offscreenCanvas, 0, 0);

      // --- Update and draw sparkling/glittering particles on the main canvas ---
      particles.forEach((particle) => {
        if (!particle.isAlive) return;

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

          // Check if particle is off-screen, mark as dead for pooling
          if (particle.y > canvas.height + particle.radius * 2) {
            particle.isAlive = false;
          }

          // Wrap around edges (for x-axis)
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
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
          ctx.shadowBlur = particle.radius * 2;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- Update and draw leaf particles ---
      if (isFallingElementsEnabled && leafImagesLoaded) {
        // Use filter to remove 'dead' leaves and respawn them.
        leafParticles = leafParticles.filter(leaf => leaf.bounceCount <= leaf.maxBounces);
        leafParticles.forEach((leaf) => {
          // Apply gravity
          leaf.vy += 0.05;

          // Update position
          leaf.x += leaf.vx;
          leaf.y += leaf.vy;
          leaf.rotation += leaf.vRotation;

          // Wave collision (similar to gravity particles)
          const waveY =
            waveBaseY +
            Math.sin(leaf.x * 0.005 + Date.now() * 0.0005) *
              (waveAmplitude / 2) +
            Math.cos(leaf.x * 0.01 + Date.now() * 0.0003) *
              (waveAmplitude / 4);

          if (leaf.y + leaf.size / 2 > waveY) {
            if (leaf.vy > 0) {
              leaf.y = waveY - leaf.size / 2;
              leaf.vy *= -0.6;
              leaf.vx *= 0.9;
              leaf.bounceCount++;
            }
          }

          // Reset if falls off screen
          if (leaf.y > canvas.height + leaf.size) {
            leaf.y = -leaf.size;
            leaf.x = Math.random() * canvas.width;
            leaf.vy = Math.random() * 0.5 + 0.5;
            leaf.rotation = Math.random() * 360;
            leaf.vRotation = Math.random() * 1 - 0.5;
            leaf.vx = (Math.random() - 0.5) * 0.2;
            leaf.bounceCount = 0;
            leaf.maxBounces = Math.floor(Math.random() * 3) + 3;
          }

          // Draw leaf
          ctx.save();
          ctx.translate(leaf.x + leaf.size / 2, leaf.y + leaf.size / 2);
          ctx.rotate(leaf.rotation * Math.PI / 180);
          ctx.drawImage(leaf.image, -leaf.size / 2, -leaf.size / 2, leaf.size, leaf.size);
          ctx.restore();
        });

        // Continuous spawning of leaves
        const desiredLeafCount = 30;
        if (leafParticles.length < desiredLeafCount) {
          const leavesToSpawn = desiredLeafCount - leafParticles.length;
          for (let i = 0; i < leavesToSpawn; i++) {
            const randomImage = leafImageRefs.current[Math.floor(Math.random() * leafImageRefs.current.length)];
            leafParticles.push({
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height * 0.5,
                vx: (Math.random() - 0.5) * 0.2,
                vy: Math.random() * 0.5 + 0.5,
                rotation: Math.random() * 360,
                vRotation: Math.random() * 1 - 0.5,
                size: Math.random() * 30 + 20,
                image: randomImage,
                bounceCount: 0,
                maxBounces: Math.floor(Math.random() * 3) + 3,
                isAlive: false
            });
          }
        }
      }

      ctx.shadowBlur = 0;

      // Respawn particles using object pooling
      const currentNumParticles = getNumParticles(particleDensity);
      if (particles.filter(p => p.isAlive).length < currentNumParticles) {
        const deadParticle = particles.find(p => !p.isAlive);
        if (deadParticle) {
          deadParticle.x = Math.random() * canvas.width;
          deadParticle.y = -deadParticle.radius;
          deadParticle.vy = (Math.random() - 0.5) * 0.5;
          deadParticle.isAlive = true;
        } else {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * drawAreaEndY,
            radius: Math.random() * 3 + 1,
            color: particleColor,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            isAlive: true,
          });
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
    isFallingElementsEnabled,
    animatedBackgroundColor,
    animatedBackgroundOpacity,
    leafImagesLoaded,
    waveTrailColor,
    waveTrailOpacity,
  ]);

  return <canvas ref={canvasRef} className={backgroundStyles} />;
};

export default LuminousParticlesBackground;