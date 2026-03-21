import { useEffect, useState } from 'react';
import { fetchAudioToursFromSanity, SanityAudioTour } from '../services/sanity';

export const useAudioTours = () => {
  const [tours, setTours] = useState<SanityAudioTour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await fetchAudioToursFromSanity();
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

