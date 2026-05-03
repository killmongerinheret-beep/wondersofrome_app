import { useState, useEffect, useCallback } from 'react';

import fallbackSights from '../data/sights.json';
import { fetchSights } from '../services/content';
import { saveCachedSights, getCachedSights, clearCachedSights } from '../services/sqlite';
import { getAudioCdnBaseUrl } from '../config/audioCdn';
import { Sight, AudioLang, AudioVariant } from '../types';

type SightsState = {
  sights: Sight[];
  loading: boolean;
  source: 'remote' | 'cache' | 'fallback';
  refresh: () => Promise<void>;
};

export const useSights = (): SightsState => {
  const [sights, setSights] = useState<Sight[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'remote' | 'cache' | 'fallback'>('fallback');

  const applyCdnToSights = useCallback((list: Sight[]): Sight[] => {
    const cdnBase = getAudioCdnBaseUrl();
    if (!cdnBase) return list;

    return list.map((s) => {
      const audioFiles = { ...(s.audioFiles ?? {}) };
      const langs: AudioLang[] = [
        'en',
        'it',
        'es',
        'fr',
        'de',
        'zh',
        'ja',
        'pt',
        'pl',
        'ru',
        'ar',
        'ko',
      ];
      const variants: AudioVariant[] = ['quick', 'deep', 'kids'];
      
      const r2FolderMap: Record<string, string> = {
        'vatican-museums': 'vatican-museums',
        'st-peters-basilica': 'st-peters-basilica',
        'sistine-chapel': 'sistine-chapel',
        'vatican-pinacoteca': 'vatican-pinacoteca',
        'jewish-ghetto': 'jewish-ghetto',
        'ostia-antica': 'ostia-antica',
      };

      const existingR2Folders = new Set([
        'colosseum',
        'forum',
        'heart',
        'jewish-ghetto',
        'ostia-antica',
        'pantheon',
        'sistine-chapel',
        'st-peters-basilica',
        'trastevere',
        'vatican-museums',
        'vatican-pinacoteca',
      ]);

      for (const lang of langs) {
        for (const variant of variants) {
          const existing = audioFiles?.[lang]?.[variant]?.url?.trim() ?? '';
          if (!existing || existing.includes('example.com')) {
            const folderName = r2FolderMap[s.id] ?? s.id;

            if (existingR2Folders.has(folderName)) {
              const fileToUse = (variant === 'quick' || variant === 'deep') ? 'deep' : variant;
              audioFiles[lang] = audioFiles[lang] ?? {};
              audioFiles[lang]![variant] = {
                url: `${cdnBase}/${lang}/${folderName}/${fileToUse}.mp3`,
                duration: audioFiles[lang]?.[variant]?.duration ?? 0,
                size: audioFiles[lang]?.[variant]?.size ?? 0,
              };
            }
          }
        }
      }
      return { ...s, audioFiles };
    });
  }, []);

  const load = useCallback(
    async (forceRemote = false) => {
      setLoading(true);
      try {
        // 1. Try SQLite cache first (unless forced refresh)
        if (!forceRemote) {
          const cached = await getCachedSights<Sight>();
          if (cached && cached.length > 0) {
            setSights(applyCdnToSights(cached));
            setSource('cache');
            setLoading(false);
            // Refresh in background
            fetchAndSave().catch(() => {});
            return;
          }
        }

        // 2. Fetch from remote CMS
        await fetchAndSave();
      } catch {
        // 3. Fall back to bundled JSON
        setSights(applyCdnToSights(fallbackSights as Sight[]));
        setSource('fallback');
      } finally {
        setLoading(false);
      }
    },
    [applyCdnToSights]
  );

  const fetchAndSave = async () => {
    const remote = await fetchSights();
    if (remote.length > 0) {
      await saveCachedSights(remote);
      setSights(applyCdnToSights(remote));
      setSource('remote');
    } else {
      setSights(applyCdnToSights(fallbackSights as Sight[]));
      setSource('fallback');
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return {
    sights,
    loading,
    source,
    refresh: async () => {
      await clearCachedSights();
      await load(true);
    },
  };
};
