import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { useAuthStore } from '../../src/store/authStore';
import { LanguageSelector } from '../../src/components';

export default function AccountScreen() {
  const router = useRouter();
  const { t, language } = useStore();
  const { user, isAuthenticated, isAdmin, isSuperAdmin, logout, loadUser, isLoading } = useAuthStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const getLanguageName = () => {
    switch (language) {
      case 'nl': return 'Nederlands';
      case 'fr': return 'Français';
      case 'en': return 'English';
      case 'tr': return 'Türkçe';
      default: return 'Nederlands';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'language-outline' as const,
      title: t('language'),
      subtitle: getLanguageName(),
      onPress: () => setShowLanguageModal(true),
      showAlways: true,
    },
    {
      icon: 'receipt-outline' as const,
      title: t('orders'),
      subtitle: 'View your orders',
      onPress: () => {},
      showAlways: true,
    },
    {
      icon: 'help-circle-outline' as const,
      title: 'Help & Support',
      subtitle: '',
      onPress: () => {},
      showAlways: true,
    },
    {
      icon: 'information-circle-outline' as const,
      title: 'About',
      subtitle: 'v1.0.0',
      onPress: () => {},
      showAlways: true,
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e67e22" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('account')}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Section */}
        {isAuthenticated && user ? (
          <View style={styles.userSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {(isAdmin || isSuperAdmin) && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.loginSection}>
            <View style={styles.loginIconContainer}>
              <Ionicons name="person-circle-outline" size={64} color="#ccc" />
            </View>
            <Text style={styles.loginTitle}>Sign in to your account</Text>
            <Text style={styles.loginSubtitle}>
              Access your orders, wishlist, and more
            </Text>
            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/auth/login')}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => router.push('/auth/register')}
              >
                <Text style={styles.registerButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Admin Section - Only show if user is admin */}
        {isAuthenticated && isAdmin && (
          <View style={styles.adminSection}>
            <View style={styles.adminHeader}>
              <View style={styles.adminIconContainer}>
                <Ionicons name="shield-checkmark" size={24} color="#e67e22" />
              </View>
              <View style={styles.adminInfo}>
                <Text style={styles.adminTitle}>{t('admin')}</Text>
                <Text style={styles.adminSubtitle}>
                  {isSuperAdmin ? 'Full access to all features' : 'Manage products & orders'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin')}
            >
              <Text style={styles.adminButtonText}>Go to Admin Panel</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
            {isSuperAdmin && (
              <TouchableOpacity
                style={[styles.adminButton, styles.settingsButton]}
                onPress={() => router.push('/admin/settings')}
              >
                <Text style={styles.adminButtonText}>Site Settings</Text>
                <Ionicons name="settings-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name={item.icon} size={24} color="#666" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}

        {/* Store Info */}
        <View style={styles.storeInfoSection}>
          <Text style={styles.storeInfoTitle}>Belgian Hardware Store</Text>
          <Text style={styles.storeInfoText}>
            Your trusted hardware store in Belgium's Flemish region.
          </Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={18} color="#666" />
              <Text style={styles.contactText}>Flemish Region, Belgium</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color="#666" />
              <Text style={styles.contactText}>+32 XXX XXX XXX</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={18} color="#666" />
              <Text style={styles.contactText}>info@hardwarestore.be</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <LanguageSelector
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e67e22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginIconContainer: {
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  authButtons: {
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e67e22',
  },
  registerButtonText: {
    color: '#e67e22',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff5eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminInfo: {
    flex: 1,
    marginLeft: 12,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  adminSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e67e22',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  settingsButton: {
    backgroundColor: '#9b59b6',
    marginTop: 8,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  storeInfoSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e67e22',
    marginBottom: 8,
  },
  storeInfoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 24,
  },
});
