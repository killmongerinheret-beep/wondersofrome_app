import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

import fallbackSights from '../data/sights.json';
import { getCachedSights, getSetting, setSetting } from '../services/sqlite';
import { GEOFENCE_TASK } from '../services/geofencingTask';
import { Sight } from '../types';

const SETTING_KEY = 'geofencing_enabled';
const MIN_RADIUS = 100; // Meters for reliability

export const useGeofencing = () => {
  const [isGeofencing, setIsGeofencing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async (): Promise<boolean> => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== Location.PermissionStatus.GRANTED) {
      setPermissionStatus(foregroundStatus);
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    setPermissionStatus(backgroundStatus);

    if (backgroundStatus === Location.PermissionStatus.GRANTED) {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
      setIsGeofencing(isRegistered);
      return true;
    }
    return false;
  };

  const startGeofencing = async () => {
    // Small delay to ensure native modules are fully initialized
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Check if user disabled it in settings
    const enabledSetting = await getSetting(SETTING_KEY, 'true');
    if (enabledSetting === 'false') return;

    const granted =
      permissionStatus === Location.PermissionStatus.GRANTED ? true : await checkPermissions();
    if (!granted) return;

    try {
      const allSights = (await getCachedSights<Sight>()) ?? (fallbackSights as Sight[]);

      let sightsToWatch = allSights;

      // iOS has a limit of 20 geofence regions.
      // For a better implementation, we should sort by proximity to user.
      if (Platform.OS === 'ios' && allSights.length > 20) {
        const userLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        sightsToWatch = [...allSights]
          .sort((a, b) => {
            const distA =
              Math.pow(a.lat - userLoc.coords.latitude, 2) +
              Math.pow(a.lng - userLoc.coords.longitude, 2);
            const distB =
              Math.pow(b.lat - userLoc.coords.latitude, 2) +
              Math.pow(b.lng - userLoc.coords.longitude, 2);
            return distA - distB;
          })
          .slice(0, 20);
      }

      const regions = sightsToWatch
        .filter((s) => s.lat != null && s.lng != null)
        .map((sight) => ({
          identifier: sight.id,
          latitude: Number(sight.lat),
          longitude: Number(sight.lng),
          radius: Math.max(sight.radius || 0, MIN_RADIUS),
          notifyOnEnter: true,
          notifyOnExit: false,
        }));

      if (regions.length === 0) {
        console.log('No valid regions for geofencing');
        return;
      }

      await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
      setIsGeofencing(true);
      await setSetting(SETTING_KEY, 'true');
      console.log(`Geofencing started with ${regions.length} regions`);
    } catch (error) {
      console.error('Error starting geofencing:', error);
    }
  };

  const stopGeofencing = async (userDisabled: boolean = false) => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
      if (isRegistered) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK);
        setIsGeofencing(false);
        if (userDisabled) {
          await setSetting(SETTING_KEY, 'false');
        }
        console.log('Geofencing stopped');
      }
    } catch (error) {
      console.error('Error stopping geofencing:', error);
    }
  };

  const toggleGeofencing = useCallback(
    async (enable: boolean) => {
      if (enable) {
        await setSetting(SETTING_KEY, 'true');
        await startGeofencing();
      } else {
        await stopGeofencing(true);
      }
    },
    [permissionStatus, startGeofencing]
  );

  return {
    isGeofencing,
    permissionStatus,
    startGeofencing,
    stopGeofencing,
    toggleGeofencing,
  };
};
