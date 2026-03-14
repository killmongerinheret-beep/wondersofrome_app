import Mapbox from '@rnmapbox/maps';

const ROME_BOUNDS_NE = [12.6, 42.0];
const ROME_BOUNDS_SW = [12.4, 41.8];
const PACK_NAME = 'rome-center';

export const downloadRomeMap = async (
  onProgress: (percentage: number) => void,
  onError: (error: Error) => void
) => {
  try {
    const progressListener = (offlineRegion: any, status: any) => {
      onProgress(status.percentage);
    };

    const errorListener = (offlineRegion: any, error: any) => {
      console.error('Map download error:', error);
      onError(error);
    };

    await Mapbox.offlineManager.createPack({
      name: PACK_NAME,
      styleURL: Mapbox.StyleURL.Street,
      minZoom: 14,
      maxZoom: 22,
      bounds: [ROME_BOUNDS_NE, ROME_BOUNDS_SW],
    }, progressListener, errorListener);
  } catch (error) {
    onError(error as Error);
  }
};

export const checkMapPackStatus = async () => {
  const packs = await Mapbox.offlineManager.getPacks();
  const romePack = packs.find((p) => p.name === PACK_NAME);
  return romePack;
};

export const deleteMapPack = async () => {
  await Mapbox.offlineManager.deletePack(PACK_NAME);
};
