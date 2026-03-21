import { useEffect, useState } from 'react';
import {
  subscribePlayer,
  getPlayerState,
  playAudioForSight,
  pauseAudio,
  resumeAudio,
  seekAudio,
  startQueue,
  playNextInQueue,
  playPrevInQueue,
  stopAudio,
  PlayerState,
} from '../services/audio';
import { AudioVariant } from '../types';

export const useAudioPlayer = () => {
  const [state, setState] = useState<PlayerState>(getPlayerState);

  useEffect(() => {
    const unsub = subscribePlayer(setState);
    return unsub;
  }, []);

  const play = (
    sightId: string,
    variant: AudioVariant | string,
    remoteUrl?: string,
    onProgress?: (p: number) => void,
  ) => playAudioForSight(sightId, variant, remoteUrl, onProgress);

  return {
    ...state,
    play,
    pause: pauseAudio,
    resume: resumeAudio,
    seek: seekAudio,
    startQueue,
    next: playNextInQueue,
    prev: playPrevInQueue,
    stop: stopAudio,
  };
};
