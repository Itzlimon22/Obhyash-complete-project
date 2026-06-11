import { useState, useEffect } from 'react';

/**
 * A hook that counts up from one number to another over a specified duration
 */
export function useCountUp(
  targetValue: number,
  duration: number = 2000,
  startValue: number = 0,
  decimals: number = 0,
) {
  const [count, setCount] = useState(startValue);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function: easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const rawValue = easing * (targetValue - startValue) + startValue;
      const factor = Math.pow(10, decimals);
      const currentCount = Math.floor(rawValue * factor) / factor;
      setCount(currentCount);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration, startValue, decimals]);

  return count;
}
