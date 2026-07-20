import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router';

export function NavigationProgressBar() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== 'idle';
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let finishTimer: NodeJS.Timeout;

    if (isNavigating) {
      setVisible(true);
      setProgress(15);

      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(timer);
            return 85;
          }
          return prev + Math.random() * 15;
        });
      }, 150);
    } else {
      setProgress(100);
      finishTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [isNavigating]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-0.5 pointer-events-none bg-transparent overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gold-gradient shadow-[0_0_8px_rgba(234,179,8,0.7)] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: 'width, opacity',
        }}
      />
    </div>
  );
}
