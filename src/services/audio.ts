import { createAudioPlayer, setAudioModeAsync, AudioPlayer as ExpoAudioPlayer } from 'expo-audio';
import { getLocalAudioUri, downloadAudioPack } from './filesystem';
import * as Notifications from 'expo-notifications';

export type PlayerState = {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  sightId: string | null;
  variant: string | null;
};

type Listener = (state: PlayerState) => void;

let player: ExpoAudioPlayer | null = null;
let listeners: Listener[] = [];
let tickInterval: ReturnType<typeof setInterval> | null = null;

let state: PlayerState = {
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  sightId: null,
  variant: null,
};

const emit = () => listeners.forEach((l) => l({ ...state }));

const startTick = () => {
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    if (!player) return;
    state.positionMs = (player.currentTime ?? 0) * 1000;
    state.durationMs = (player.duration ?? 0) * 1000;
    state.isPlaying = player.playing ?? false;
    emit();
  }, 500);
};

const stopTick = () => {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
};

export const subscribePlayer = (fn: Listener) => {
  listeners.push(fn);
  fn({ ...state });
  return () => { listeners = listeners.filter((l) => l !== fn); };
};

export const getPlayerState = () => ({ ...state });

export const playAudioForSight = async (
  sightId: string,
  variant: string = 'quick',
  remoteUrl?: string,
  onDownloadProgress?: (p: number) => void,
) => {
  try {
    // Stop existing
    if (player) { player.pause(); player.remove(); player = null; }
    stopTick();

    // Try local first
    let uri = await getLocalAudioUri(sightId, variant);

    // Download if not cached and we have a URL
    if (!uri && remoteUrl) {
      uri = await downloadAudioPack(sightId, variant, remoteUrl, onDownloadProgress);
    }

    if (!uri) {
      console.log(`Audio not available for ${sightId}/${variant}`);
      return false;
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

    state = { isPlaying: true, positionMs: 0, durationMs: 0, sightId, variant };
    emit();
    startTick();
    return true;
  } catch (error) {
    console.error('Error playing audio:', error);
    return false;
  }
};

export const pauseAudio = () => {
  if (player) { player.pause(); state.isPlaying = false; emit(); }
};

export const resumeAudio = () => {
  if (player) { player.play(); state.isPlaying = true; emit(); }
};

export const seekAudio = (positionMs: number) => {
  if (player) { player.seekTo(positionMs / 1000); state.positionMs = positionMs; emit(); }
};

export const stopAudio = () => {
  if (player) { player.pause(); player.remove(); player = null; }
  stopTick();
  state = { isPlaying: false, positionMs: 0, durationMs: 0, sightId: null, variant: null };
  emit();
};

export const notifyUser = async (title: string, body?: string) => {
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
};
