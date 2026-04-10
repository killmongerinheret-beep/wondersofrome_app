import { useEffect, useState } from 'react';
import { AudioTour, fetchAudioTours } from '../services/content';

export const useAudioTours = () => {
  const [tours, setTours] = useState<AudioTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await fetchAudioTours();
        if (mounted) setTours(t);
      } catch {
        if (mounted) setTours([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { tours, loading };
};
