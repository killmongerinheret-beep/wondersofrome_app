import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { MyToursScreen } from './src/screens/MyToursScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { ConciergeScreen } from './src/screens/ConciergeScreen';
import { useGeofencing } from './src/hooks/useGeofencing';
import * as Notifications from 'expo-notifications';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';
import { getMapboxAccessToken } from './src/config/mapbox';

const Tab = createBottomTabNavigator();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const { startGeofencing } = useGeofencing();

  useEffect(() => {
    startGeofencing();
  }, []);

  useEffect(() => {
    const token = getMapboxAccessToken();
    if (token) {
      Mapbox.setAccessToken(token);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Explore') {
                iconName = focused ? 'map' : 'map-outline';
              } else if (route.name === 'My Tours') {
                iconName = focused ? 'cloud-done' : 'cloud-outline';
              } else if (route.name === 'Wallet') {
                iconName = focused ? 'wallet' : 'wallet-outline';
              } else if (route.name === 'Concierge') {
                iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
              }

              return <Ionicons name={iconName as any} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            headerShown: false,
            tabBarStyle: {
              position: 'absolute',
              borderTopWidth: 0,
              elevation: 0,
              height: Platform.OS === 'ios' ? 88 : 60,
            },
            tabBarBackground: () => (
              <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
            ),
          })}
          initialRouteName="Explore"
        >
          <Tab.Screen name="Explore" component={ExploreScreen} />
          <Tab.Screen name="My Tours" component={MyToursScreen} />
          <Tab.Screen name="Wallet" component={WalletScreen} />
          <Tab.Screen name="Concierge" component={ConciergeScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
