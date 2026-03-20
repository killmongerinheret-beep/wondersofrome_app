import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { downloadAudioPack, getLocalAudioUri } from '../services/filesystem';
import sights from '../data/sights.json';
import { Sight, AudioVariant, AudioLang } from '../types';

export const useOfflineContent = () => {
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [downloadedSights, setDownloadedSights] = useState<{ [key: string]: boolean }>({});
  const lang: AudioLang = 'en';

  useEffect(() => {
    checkDownloads();
  }, []);

  const checkDownloads = async () => {
    const status: { [key: string]: boolean } = {};
    for (const sight of sights as Sight[]) {
      // Check if 'quick' variant is downloaded as a proxy for the sight being available
      const uri = await getLocalAudioUri(sight.id, `${lang}_quick`);
      status[sight.id] = !!uri;
    }
    setDownloadedSights(status);
  };

  const resolveAudioUrl = (sight: Sight, variant: AudioVariant): string | null => {
    const url = sight.audioFiles?.[lang]?.[variant]?.url?.trim();
    if (!url) return null;
    if (url.includes('example.com')) return null;
    return url;
  };

  const downloadSight = async (sightId: string) => {
    const sight = (sights as Sight[]).find((s) => s.id === sightId);
    if (!sight) return;

    setDownloadProgress(prev => ({ ...prev, [sightId]: 0 }));

    try {
      // Download all variants
      const variants: AudioVariant[] = ['quick', 'deep', 'kids'];
      let completed = 0;
      
      for (const variant of variants) {
        const url = resolveAudioUrl(sight, variant);
        if (!url) {
          Alert.alert('Audio coming soon', 'This tour does not have downloadable audio yet.');
          setDownloadProgress(prev => {
            const next = { ...prev };
            delete next[sightId];
            return next;
          });
          return;
        }
        await downloadAudioPack(sightId, `${lang}_${variant}`, url, (progress) => {
           // Aggregate progress logic could be here
        });
        completed++;
        setDownloadProgress(prev => ({ ...prev, [sightId]: completed / variants.length }));
      }

      setDownloadedSights(prev => ({ ...prev, [sightId]: true }));
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[sightId];
        return newProgress;
      });
    } catch (error) {
      console.error(`Error downloading sight ${sightId}:`, error);
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[sightId];
        return newProgress;
      });
    }
  };

  return {
    downloadedSights,
    downloadProgress,
    downloadSight,
    checkDownloads
  };
};
