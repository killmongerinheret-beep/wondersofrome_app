import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View, Text } from 'react-native';

import { ExploreScreen } from '../screens/ExploreScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MyTicketsScreen } from '../screens/MyTicketsScreen';
import { ConciergeScreen } from '../screens/ConciergeScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { useCart } from '../context/CartContext';
import { useGeofencing } from '../hooks/useGeofencing';
import { theme } from '../theme';

const Tab = createBottomTabNavigator();

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

export function AppNavigator() {
  const { startGeofencing } = useGeofencing();
  
  useEffect(() => {
    // Defer geofencing initialization to avoid blocking the initial load
    const timer = setTimeout(() => {
      startGeofencing();
    }, 1000);
    
    return () => clearTimeout(timer);
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
            Concierge: ['chatbubble-ellipses', 'chatbubble-ellipses-outline'],
          };
          
          const [active, inactive] = icons[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={24} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.brandLight,
        tabBarInactiveTintColor: theme.colors.textMuted,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView 
            tint="dark" 
            intensity={80} 
            style={StyleSheet.absoluteFill} 
          />
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

const styles = StyleSheet.create({
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
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
