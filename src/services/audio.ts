import { createAudioPlayer, setAudioModeAsync, AudioPlayer as ExpoAudioPlayer } from 'expo-audio';
import { getLocalAudioUri, downloadAudioPack } from './filesystem';
import * as Notifications from 'expo-notifications';
import { getProgress, updateProgress } from './sqlite';

export type PlayerState = {
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  sightId: string | null;
  variant: string | null;
  queue: QueueItem[] | null;
  queueIndex: number;
  queueTitle: string | null;
};

type Listener = (state: PlayerState) => void;

export type QueueItem = {
  sightId: string;
  variant: string;
  remoteUrl?: string;
  title?: string;
};

let player: ExpoAudioPlayer | null = null;
let listeners: Listener[] = [];
let tickInterval: ReturnType<typeof setInterval> | null = null;
let lastSavedAt = 0;
let saveInFlight = false;
let queue: QueueItem[] | null = null;
let queueIndex = 0;
let queueTitle: string | null = null;
let lastEndedKey: string | null = null;
let lastEndedAt = 0;

let state: PlayerState = {
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  sightId: null,
  variant: null,
  queue: null,
  queueIndex: 0,
  queueTitle: null,
};

const emit = () => listeners.forEach((l) => l({ ...state }));

const computeCompleted = (positionMs: number, durationMs: number) => {
  if (durationMs <= 0) return false;
  if (positionMs >= durationMs - 10_000) return true;
  if (positionMs / durationMs >= 0.985) return true;
  return false;
};

const persistProgress = async (force: boolean = false) => {
  if (!state.sightId || !state.variant) return;
  const now = Date.now();
  if (!force && now - lastSavedAt < 5000) return;
  if (saveInFlight) return;
  saveInFlight = true;
  lastSavedAt = now;
  try {
    const completed = computeCompleted(state.positionMs, state.durationMs);
    await updateProgress(state.sightId, completed, state.variant, Math.max(0, Math.floor(state.positionMs)));
  } catch {
  } finally {
    saveInFlight = false;
  }
};

const startTick = () => {
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    if (!player) return;
    state.positionMs = (player.currentTime ?? 0) * 1000;
    state.durationMs = (player.duration ?? 0) * 1000;
    state.isPlaying = player.playing ?? false;
    emit();
    persistProgress(false);
    if (queue && state.sightId && state.variant && state.durationMs > 0) {
      const ended = !state.isPlaying && state.positionMs >= state.durationMs - 650;
      if (ended) {
        const key = `${state.sightId}:${state.variant}:${queueIndex}`;
        const now = Date.now();
        if (lastEndedKey !== key || now - lastEndedAt > 2500) {
          lastEndedKey = key;
          lastEndedAt = now;
          persistProgress(true).catch(() => {});
          playNextInQueue().catch(() => {});
        }
      }
    }
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
  options?: { preserveQueue?: boolean; queueIndex?: number; queueTitle?: string | null },
) => {
  try {
    await persistProgress(true);
    // Stop existing
    if (player) { player.pause(); player.remove(); player = null; }
    stopTick();
    if (!options?.preserveQueue) {
      queue = null;
      queueIndex = 0;
      queueTitle = null;
    }
    if (typeof options?.queueIndex === 'number') queueIndex = options.queueIndex;
    if (options?.queueTitle !== undefined) queueTitle = options.queueTitle ?? null;

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

    let resumePositionMs = 0;
    try {
      const p = await getProgress(sightId);
      if (p && !p.completed && p.last_played_variant === variant && p.last_position > 5000) {
        resumePositionMs = p.last_position;
      }
    } catch {
    }

    player = createAudioPlayer(uri, { updateInterval: 500 });
    player.play();

    state = {
      isPlaying: true,
      positionMs: 0,
      durationMs: 0,
      sightId,
      variant,
      queue,
      queueIndex,
      queueTitle,
    };
    emit();
    startTick();

    if (resumePositionMs > 0) {
      setTimeout(() => {
        if (!player) return;
        try {
          player.seekTo(resumePositionMs / 1000);
          state.positionMs = resumePositionMs;
          emit();
        } catch {
        }
      }, 250);
    }
    return true;
  } catch (error) {
    console.error('Error playing audio:', error);
    return false;
  }
};

export const pauseAudio = () => {
  if (player) { player.pause(); state.isPlaying = false; emit(); persistProgress(true); }
};

export const resumeAudio = () => {
  if (player) { player.play(); state.isPlaying = true; emit(); }
};

export const seekAudio = (positionMs: number) => {
  if (player) {
    player.seekTo(positionMs / 1000);
    state.positionMs = positionMs;
    emit();
    persistProgress(true);
  }
};

export const stopAudio = () => {
  persistProgress(true);
  if (player) { player.pause(); player.remove(); player = null; }
  stopTick();
  queue = null;
  queueIndex = 0;
  queueTitle = null;
  state = { isPlaying: false, positionMs: 0, durationMs: 0, sightId: null, variant: null, queue: null, queueIndex: 0, queueTitle: null };
  emit();
};

export const startQueue = async (items: QueueItem[], startAt: number = 0, title?: string) => {
  queue = items.filter((i) => i.sightId && i.variant);
  queueIndex = Math.max(0, Math.min(queue.length - 1, startAt));
  queueTitle = title ?? null;
  const item = queue[queueIndex];
  if (!item) return false;
  return await playAudioForSight(item.sightId, item.variant, item.remoteUrl, undefined, {
    preserveQueue: true,
    queueIndex,
    queueTitle,
  });
};

export const playNextInQueue = async () => {
  if (!queue || queue.length === 0) return false;
  const next = queueIndex + 1;
  if (next >= queue.length) {
    stopAudio();
    return false;
  }
  queueIndex = next;
  const item = queue[queueIndex];
  return await playAudioForSight(item.sightId, item.variant, item.remoteUrl, undefined, {
    preserveQueue: true,
    queueIndex,
    queueTitle,
  });
};

export const playPrevInQueue = async () => {
  if (!queue || queue.length === 0) return false;
  const prev = queueIndex - 1;
  if (prev < 0) return false;
  queueIndex = prev;
  const item = queue[queueIndex];
  return await playAudioForSight(item.sightId, item.variant, item.remoteUrl, undefined, {
    preserveQueue: true,
    queueIndex,
    queueTitle,
  });
};

export const jumpToQueueIndex = async (index: number) => {
  if (!queue || queue.length === 0) return false;
  const nextIndex = Math.max(0, Math.min(queue.length - 1, index));
  queueIndex = nextIndex;
  const item = queue[queueIndex];
  if (!item) return false;
  return await playAudioForSight(item.sightId, item.variant, item.remoteUrl, undefined, {
    preserveQueue: true,
    queueIndex,
    queueTitle,
  });
};

export const notifyUser = async (title: string, body?: string) => {
  await Notifications.scheduleNotificationAsync({ content: { title, body }, trigger: null });
};
