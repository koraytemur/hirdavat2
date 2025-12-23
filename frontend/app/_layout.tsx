import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from '../src/store/useStore';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const { initializeStore } = useStore();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    initializeStore();
    loadUser();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="product/[id]" 
          options={{ 
            headerShown: true,
            headerTitle: '',
            headerBackTitle: '',
          }} 
        />
        <Stack.Screen 
          name="checkout/index" 
          options={{ 
            headerShown: true,
            headerTitle: '',
            headerBackTitle: '',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="checkout/success" 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="admin" 
          options={{ 
            headerShown: false,
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
