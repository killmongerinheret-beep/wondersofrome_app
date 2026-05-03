import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import fallbackSights from '../data/sights.json';
import { Sight } from '../types';
import { playAudioForSight, notifyUser, getPlayerState } from './audio';
import { getCachedSights } from './sqlite';

export const GEOFENCE_TASK = 'rome-geofence-task';
const LAST_ENTER_BY_ID: Record<string, number> = {};

export const defineGeofencingTask = () => {
  TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
    if (error) {
      console.error('Geofencing task error:', error);
      return;
    }

    const { eventType, region } = data as {
      eventType: Location.GeofencingEventType;
      region: Location.LocationRegion;
    };

    if (eventType === Location.GeofencingEventType.Enter) {
      if (!region?.identifier) return;
      const now = Date.now();
      const last = LAST_ENTER_BY_ID[region.identifier] ?? 0;

      // Throttle triggers for the same sight (10 mins)
      if (now - last < 1000 * 60 * 10) return;
      LAST_ENTER_BY_ID[region.identifier] = now;

      // Get current sights to find the correct data
      const sights = (await getCachedSights<Sight>()) ?? (fallbackSights as Sight[]);
      const sight = sights.find((s) => s.id === region.identifier);

      if (sight) {
        const currentState = getPlayerState();
        if (currentState.isPlaying && currentState.sightId !== sight.id) {
          // If already playing something else, just notify without auto-switching
          await notifyUser(`Near ${sight.name}`, 'Tap the notification to listen to this sight.');
          return;
        }

        await notifyUser(`Welcome to ${sight.name}`, 'Starting audio tour...');
        const url = sight.audioFiles?.en?.quick?.url;
        // Use en_quick as the auto-play default
        await playAudioForSight(sight.id, 'en_quick', url);
      }
    }
  });
};
