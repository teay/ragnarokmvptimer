import { styled } from '@linaria/react';
import React, { useEffect, useState } from 'react';
import styles from './FallingElements.module.css';

// Dynamically import leaf images
const leafImages = Array.from({ length: 16 }).map((_, i) => `/ragnarokmvptimer/assets/leaves/leaf${i + 1}.png`);

const Element = styled.img`
  position: absolute;
  object-fit: contain;
  pointer-events: none;
`;

interface FallingElementsProps {
  count?: number;
}

export const FallingElements: React.FC<FallingElementsProps> = ({ count = 30 }) => {
  const [elements, setElements] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const newElements = Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 30 + 20; // Size between 20px and 50px
      const duration = Math.random() * 10 + 5; // Duration between 5s and 15s
      const delay = Math.random() * 5; // Delay up to 5s
      const startLeft = Math.random() * 100; // Random horizontal start position
      const swayAmount = Math.random() * 50 - 25; // Sway between -25px and 25px
      const rotateAmount = Math.random() * 720 - 360; // Rotate between -360deg and 360deg
      const selectedImage = leafImages[Math.floor(Math.random() * leafImages.length)];

      return (
        <Element
          key={i}
          className={styles['fall-and-sway-animation']}
          src={selectedImage}
          alt="falling element"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            left: `${startLeft}%`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            '--sway-x': `${swayAmount}px`,
            '--rotate-deg': `${rotateAmount}deg`,
          } as React.CSSProperties}
        />
      );
    });
    setElements(newElements);
  }, [count]);

  return <>{elements}</>;
};


