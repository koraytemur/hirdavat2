import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { LanguageSelector } from '../../src/components';

export default function AccountScreen() {
  const router = useRouter();
  const { t, language, isAdmin, setIsAdmin } = useStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const getLanguageName = () => {
    switch (language) {
      case 'nl': return 'Nederlands';
      case 'fr': return 'Français';
      case 'en': return 'English';
      case 'tr': return 'Türkçe';
      default: return 'Nederlands';
    }
  };

  const menuItems = [
    {
      icon: 'language-outline' as const,
      title: t('language'),
      subtitle: getLanguageName(),
      onPress: () => setShowLanguageModal(true),
    },
    {
      icon: 'receipt-outline' as const,
      title: t('orders'),
      subtitle: '',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline' as const,
      title: 'Help & Support',
      subtitle: '',
      onPress: () => {},
    },
    {
      icon: 'information-circle-outline' as const,
      title: 'About',
      subtitle: 'v1.0.0',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('account')}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Admin Mode Toggle */}
        <View style={styles.adminSection}>
          <View style={styles.adminHeader}>
            <View style={styles.adminIconContainer}>
              <Ionicons name="shield-checkmark" size={24} color="#e67e22" />
            </View>
            <View style={styles.adminInfo}>
              <Text style={styles.adminTitle}>{t('admin')}</Text>
              <Text style={styles.adminSubtitle}>Enable admin features</Text>
            </View>
            <Switch
              value={isAdmin}
              onValueChange={setIsAdmin}
              trackColor={{ false: '#ddd', true: '#f5d5b8' }}
              thumbColor={isAdmin ? '#e67e22' : '#fff'}
            />
          </View>
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin')}
            >
              <Text style={styles.adminButtonText}>Go to Admin Panel</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

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
  adminSection: {
    backgroundColor: '#fff',
    margin: 16,
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
