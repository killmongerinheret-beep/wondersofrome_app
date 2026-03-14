import { Directory, File, Paths } from 'expo-file-system';
import { saveDownload, getAllDownloads, getDownload, clearDownloads, clearProgress } from './sqlite';

const AUDIO_DIR = new Directory(Paths.document, 'audio');

export const ensureAudioDirectory = async () => {
  if (!AUDIO_DIR.exists) {
    AUDIO_DIR.create({ intermediates: true, idempotent: true });
  }
};

export const downloadAudioPack = async (
  sightId: string, 
  variant: string, 
  url: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  await ensureAudioDirectory();
  const fileName = `${sightId}-${variant}.m4a`;
  const destination = new File(AUDIO_DIR, fileName);

  try {
    if (onProgress) onProgress(0);
    const file = await File.downloadFileAsync(url, destination, { idempotent: true });
    await saveDownload(sightId, variant, file.uri);
    if (onProgress) onProgress(1);
    return file.uri;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const getLocalAudioUri = async (sightId: string, variant: string): Promise<string | null> => {
  const record = await getDownload(sightId, variant);
  if (record) {
    const info = Paths.info(record.local_uri);
    if (info.exists) {
      return record.local_uri;
    }
  }
  return null;
};

export const getAudioStorageUsage = async (): Promise<{
  usedBytes: number;
  totalBytes: number;
  availableBytes: number;
}> => {
  const downloads = await getAllDownloads();
  let usedBytes = 0;

  for (const d of downloads) {
    try {
      const file = new File(d.local_uri);
      if (file.exists) {
        const info = file.info();
        usedBytes += info.size ?? 0;
      }
    } catch {
      continue;
    }
  }

  return {
    usedBytes,
    totalBytes: Paths.totalDiskSpace ?? 0,
    availableBytes: Paths.availableDiskSpace ?? 0,
  };
};

export const clearAudioStorage = async () => {
  try {
    if (AUDIO_DIR.exists) {
      AUDIO_DIR.delete();
    }
  } catch {
  }
  await clearDownloads();
  await clearProgress();
};
