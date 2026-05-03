import { registerRootComponent } from 'expo';

import App from './App';
import { defineGeofencingTask } from './src/services/geofencingTask';

// Define background tasks as early as possible
defineGeofencingTask();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
