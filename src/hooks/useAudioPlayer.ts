import { useEffect, useState } from 'react';
import {
  subscribePlayer,
  playAudioForSight,
  pauseAudio,
  resumeAudio,
  seekAudio,
  stopAudio,
  getPlayerState,
  PlayerState,
} from '../services/audio';

export const useAudioPlayer = () => {
  const [playerState, setPlayerState] = useState<PlayerState>(getPlayerState());

  useEffect(() => {
    const unsub = subscribePlayer(setPlayerState);
    return unsub;
  }, []);

  const play = (sightId: string, variant = 'quick', remoteUrl?: string, onProgress?: (p: number) => void) =>
    playAudioForSight(sightId, variant, remoteUrl, onProgress);

  return {
    ...playerState,
    play,
    pause: pauseAudio,
    resume: resumeAudio,
    seek: seekAudio,
    stop: stopAudio,
  };
};
