import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CartProvider } from './src/context/CartContext';
import { MiniPlayer } from './src/components/MiniPlayer';
import { AppNavigator } from './src/navigation/AppNavigator';
import { BrandingSplash } from './src/components/BrandingSplash';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          {!isLoaded ? (
            <BrandingSplash onFinish={() => setIsLoaded(true)} />
          ) : (
            <>
              <AppNavigator />
              <MiniPlayer />
            </>
          )}
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}
