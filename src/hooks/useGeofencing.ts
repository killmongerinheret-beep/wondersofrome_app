import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { playAudioForSight, notifyUser } from '../services/audio';
import sights from '../data/sights.json';

const GEOFENCE_TASK = 'rome-geofence-task';

// Define the task in the global scope
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
    console.log(`Entered region: ${region.identifier}`);
    const sight = sights.find(s => s.id === region.identifier);
    if (sight) {
      await notifyUser(`Welcome to ${sight.name}`, 'Starting audio tour...');
      // Default to 'quick' variant for auto-play, or check user settings
      await playAudioForSight(sight.id, 'quick');
    }
  } else if (eventType === Location.GeofencingEventType.Exit) {
    console.log(`Exited region: ${region.identifier}`);
    // Optional: Stop audio or notify
  }
});

export const useGeofencing = () => {
  const [isGeofencing, setIsGeofencing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async (): Promise<boolean> => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== Location.PermissionStatus.GRANTED) {
      console.log('Foreground location permission denied');
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
    const granted =
      permissionStatus === Location.PermissionStatus.GRANTED ? true : await checkPermissions();
    if (!granted) return;

    try {
      const regions = sights.map(sight => ({
        identifier: sight.id,
        latitude: sight.lat,
        longitude: sight.lng,
        radius: sight.radius,
        notifyOnEnter: true,
        notifyOnExit: true,
      }));

      await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
      setIsGeofencing(true);
      console.log('Geofencing started');
    } catch (error) {
      console.error('Error starting geofencing:', error);
    }
  };

  const stopGeofencing = async () => {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
      if (isRegistered) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK);
        setIsGeofencing(false);
        console.log('Geofencing stopped');
      }
    } catch (error) {
      console.error('Error stopping geofencing:', error);
    }
  };

  return {
    isGeofencing,
    permissionStatus,
    startGeofencing,
    stopGeofencing
  };
};
