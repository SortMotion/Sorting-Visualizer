import { useEffect } from 'react';
import { usePlaybackStore } from '../store/usePlaybackStore';

export const INTERVAL_MS = 100;

export function usePlaybackEngine() {
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const speed = usePlaybackStore((state) => state.speed);
  const next = usePlaybackStore((state) => state.next);

  useEffect(() => {
    let id: number | undefined;

    if (isPlaying) {
      const intervalMs = INTERVAL_MS / speed;
      id = setInterval(() => {
        next();
      }, intervalMs);
    }

    return () => {
      clearInterval(id);
    };
  }, [isPlaying, speed, next]);
}
