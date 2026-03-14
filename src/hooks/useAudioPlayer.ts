import { useState } from 'react';
import { playAudioForSight, stopAudio } from '../services/audio';

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSightId, setCurrentSightId] = useState<string | null>(null);
  const [currentVariant, setCurrentVariant] = useState<string | null>(null);

  const play = async (sightId: string, variant: string = 'quick') => {
    try {
      await playAudioForSight(sightId, variant);
      setIsPlaying(true);
      setCurrentSightId(sightId);
      setCurrentVariant(variant);
    } catch (error) {
      console.error('Error in useAudioPlayer play:', error);
      setIsPlaying(false);
    }
  };

  const stop = async () => {
    try {
      await stopAudio();
      setIsPlaying(false);
      setCurrentSightId(null);
      setCurrentVariant(null);
    } catch (error) {
      console.error('Error in useAudioPlayer stop:', error);
    }
  };

  return {
    isPlaying,
    currentSightId,
    currentVariant,
    play,
    stop,
  };
};
