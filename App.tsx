import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MyTicketsScreen } from './src/screens/MyTicketsScreen';
import { ConciergeScreen } from './src/screens/ConciergeScreen';
import { ShopScreen } from './src/screens/ShopScreen';
import { CartProvider, useCart } from './src/context/CartContext';
import { useGeofencing } from './src/hooks/useGeofencing';
import * as Notifications from 'expo-notifications';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';
import { getMapboxAccessToken } from './src/config/mapbox';
import { MiniPlayer } from './src/components/MiniPlayer';
import { theme } from './src/ui/theme';
import { BrandingSplash } from './src/ui/BrandingSplash';

const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function ShopTabIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
  const { totalItems } = useCart();
  return (
    <View>
      <Ionicons name={focused ? 'bag' : 'bag-outline'} size={size} color={color} />
      {totalItems > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
        </View>
      )}
    </View>
  );
}

function AppTabs() {
  const { startGeofencing } = useGeofencing();

  useEffect(() => { startGeofencing(); }, []);

  useEffect(() => {
    const token = getMapboxAccessToken();
    if (token) Mapbox.setAccessToken(token);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Shop') return <ShopTabIcon focused={focused} color={color} size={size} />;
          const icons: Record<string, [string, string]> = {
            Home: ['home', 'home-outline'],
            Explore: ['map', 'map-outline'],
            Tickets: ['ticket', 'ticket-outline'],
            Shop: ['bag', 'bag-outline'],
            Concierge: ['chatbubble-ellipses', 'chatbubble-ellipses-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.brand,
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
      initialRouteName="Home"
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Tickets" component={MyTicketsScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Concierge" component={ConciergeScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setBooting(false), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          <AppTabs />
          <MiniPlayer />
          <BrandingSplash visible={booting} />
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
});
