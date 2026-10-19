import { useState, useEffect } from 'react';

export interface WindowDimensions {
  width: number;
  height: number;
  isMobile: boolean; // < 1024px (used for compact navigation)
  isPhone: boolean;  // < 640px
  isTablet: boolean; // >= 640px && < 1024px
  isDesktop: boolean;// >= 1024px
}

function getWindowDimensions(): WindowDimensions {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const height = typeof window !== 'undefined' ? window.innerHeight : 800;
  return {
    width,
    height,
    isMobile: width < 1024,
    isPhone: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

export default function useWindowDimensions(): WindowDimensions {
  const [windowDimensions, setWindowDimensions] = useState<WindowDimensions>(getWindowDimensions);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function handleResize() {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowDimensions(getWindowDimensions());
      }, 50);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return windowDimensions;
}