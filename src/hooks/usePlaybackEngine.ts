import { useEffect } from 'react';
import { usePlaybackStore } from '../store/usePlaybackStore';

// Exportado para que SortCanvas ajuste la duración de cada animación al ritmo de reproducción.
export const INTERVAL_MS = 150;

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
