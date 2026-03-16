import { useState, useEffect, useCallback } from 'react';
import { Sight } from '../types';
import { fetchSightsFromSanity } from '../services/sanity';
import { saveCachedSights, getCachedSights } from '../services/sqlite';
import fallbackSights from '../data/sights.json';

type SightsState = {
  sights: Sight[];
  loading: boolean;
  source: 'sanity' | 'cache' | 'fallback';
  refresh: () => Promise<void>;
};

export const useSights = (): SightsState => {
  const [sights, setSights] = useState<Sight[]>(fallbackSights as Sight[]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'sanity' | 'cache' | 'fallback'>('fallback');

  const load = useCallback(async (forceRemote = false) => {
    setLoading(true);
    try {
      // 1. Try SQLite cache first (unless forced refresh)
      if (!forceRemote) {
        const cached = await getCachedSights<Sight>();
        if (cached && cached.length > 0) {
          setSights(cached);
          setSource('cache');
          setLoading(false);
          // Refresh in background
          fetchAndSave().catch(() => {});
          return;
        }
      }

      // 2. Fetch from Sanity
      await fetchAndSave();
    } catch {
      // 3. Fall back to bundled JSON
      setSights(fallbackSights as Sight[]);
      setSource('fallback');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAndSave = async () => {
    const remote = await fetchSightsFromSanity();
    if (remote.length > 0) {
      await saveCachedSights(remote);
      setSights(remote);
      setSource('sanity');
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return {
    sights,
    loading,
    source,
    refresh: () => load(true),
  };
};
