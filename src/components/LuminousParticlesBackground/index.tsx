import React, { useRef, useEffect } from 'react';
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

import { useSettings } from '../../contexts/SettingsContext'; // Import useSettings

const LuminousParticlesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    backgroundEffectMode,
    particleDensity,
    particleColor,
    waveAmplitude,
    waveColor,
  } = useSettings(); // Get settings from context

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];

    // Determine number of particles based on density setting
    const getNumParticles = (density: 'low' | 'medium' | 'high') => {
      switch (density) {
        case 'low': return 50;
        case 'medium': return 100;
        case 'high': return 200;
        default: return 100;
      }
    };

    // Initialize particles
    const initParticles = () => {
      particles.length = 0; // Clear existing particles
      const currentNumParticles = getNumParticles(particleDensity); // Use setting
      for (let i = 0; i < currentNumParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1, // Random radius between 1 and 4
          color: particleColor, // Use setting
          vx: (Math.random() - 0.5) * 0.5, // Random velocity between -0.25 and 0.25
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
    };

    // Set canvas dimensions and initialize particles on resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles(); // Re-initialize particles on resize
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial setup

    const animate = () => {
      // Clear canvas with a slight fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Very slight black overlay
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
      ctx.beginPath();
      ctx.moveTo(0, waveBaseY);
      for (let i = 0; i < canvas.width; i++) {
        ctx.lineTo(
          i,
          waveBaseY +
            Math.sin(i * 0.005 + Date.now() * 0.0005) * (waveAmplitude / 2) + // Use waveAmplitude
            Math.cos(i * 0.01 + Date.now() * 0.0003) * (waveAmplitude / 4) // Use waveAmplitude
        );
      }
      ctx.strokeStyle = waveColor; // Use waveColor
      ctx.lineWidth = 1;
      ctx.stroke();

      // --- Sparkling/glittering particles ---
      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

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
      ctx.shadowBlur = 0; // Reset shadow after drawing all particles

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={backgroundStyles} />;
};

export default LuminousParticlesBackground;