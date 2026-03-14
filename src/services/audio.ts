import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { getLocalAudioUri } from './filesystem';
import * as Notifications from 'expo-notifications';

let player: ReturnType<typeof createAudioPlayer> | null = null;

export const playAudioForSight = async (sightId: string, variant: string = 'quick') => {
  try {
    if (player) {
      player.pause();
      player.remove();
      player = null;
    }

    const uri = await getLocalAudioUri(sightId, variant);
    if (!uri) {
      console.log(`Audio not found for ${sightId} (${variant})`);
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      allowsRecording: false,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    });

    player = createAudioPlayer(uri, { updateInterval: 500 });
    player.play();
  } catch (error) {
    console.error('Error playing audio:', error);
  }
};

export const stopAudio = async () => {
  if (player) {
    player.pause();
    player.remove();
    player = null;
  }
};

export const notifyUser = async (title: string, body?: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: null,
  });
};
