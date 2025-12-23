import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function AdminLayout() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();

  useEffect(() => {
    // Wait for auth to load before checking
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not logged in, redirect to login
        router.replace('/auth/login');
      } else if (!isAdmin) {
        // Logged in but not admin, redirect to home
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e67e22" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show unauthorized message briefly before redirect
  if (!isAuthenticated || !isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e67e22" />
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#e67e22',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerTitle: 'Admin Panel',
        }} 
      />
      <Stack.Screen 
        name="products" 
        options={{ 
          headerTitle: 'Products',
        }} 
      />
      <Stack.Screen 
        name="categories" 
        options={{ 
          headerTitle: 'Categories',
        }} 
      />
      <Stack.Screen 
        name="orders" 
        options={{ 
          headerTitle: 'Orders',
        }} 
      />
      <Stack.Screen 
        name="customers" 
        options={{ 
          headerTitle: 'Customers',
        }} 
      />
      <Stack.Screen 
        name="discounts" 
        options={{ 
          headerTitle: 'Discounts',
        }} 
      />
      <Stack.Screen 
        name="users" 
        options={{ 
          headerTitle: 'User Management',
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          headerTitle: 'Site Settings',
        }} 
      />
      <Stack.Screen 
        name="bulk-email" 
        options={{ 
          headerTitle: 'Send Bulk Email',
        }} 
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
