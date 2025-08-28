import { styled } from '@linaria/react';
import React, { useEffect, useState } from 'react';
import styles from './SparkleEffect.module.css';

const Sparkle = styled.div`
  position: absolute;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.6);
`;

interface SparkleEffectProps {
  count?: number;
}

export const SparkleEffect: React.FC<SparkleEffectProps> = ({ count = 50 }) => {
  const [sparkles, setSparkles] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const newSparkles = Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 5 + 2; // Size between 2px and 7px
      const duration = Math.random() * 2 + 1; // Duration between 1s and 3s
      const delay = Math.random() * 3; // Delay up to 3s
      const left = Math.random() * 100; // Random horizontal position
      const top = Math.random() * 100; // Random vertical position

      return (
        <Sparkle
          key={i}
          className={styles['sparkle-animation']}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
            left: `${left}%`,
            top: `${top}%`,
          }}
        />
      );
    });
    setSparkles(newSparkles);
  }, [count]);

  return <>{sparkles}</>;
};
