import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { getDashboardStats } from '../../src/services/api';
import { DashboardStats } from '../../src/types';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { t, getLocalizedText } = useStore();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const menuItems = [
    { icon: 'cube-outline', title: t('products'), route: '/admin/products', color: '#3498db' },
    { icon: 'grid-outline', title: t('categories'), route: '/admin/categories', color: '#9b59b6' },
    { icon: 'receipt-outline', title: t('orders'), route: '/admin/orders', color: '#e67e22' },
    { icon: 'people-outline', title: t('customers'), route: '/admin/customers', color: '#27ae60' },
    { icon: 'pricetag-outline', title: t('discounts'), route: '/admin/discounts', color: '#e74c3c' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e67e22" />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e67e22']} />
      }
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
            <Ionicons name="cube-outline" size={28} color="#fff" />
            <Text style={styles.statValue}>{stats?.total_products || 0}</Text>
            <Text style={styles.statLabel}>{t('products')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e67e22' }]}>
            <Ionicons name="receipt-outline" size={28} color="#fff" />
            <Text style={styles.statValue}>{stats?.total_orders || 0}</Text>
            <Text style={styles.statLabel}>{t('orders')}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#27ae60' }]}>
            <Ionicons name="cash-outline" size={28} color="#fff" />
            <Text style={styles.statValue}>€{(stats?.total_revenue || 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>{t('revenue')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#9b59b6' }]}>
            <Ionicons name="people-outline" size={28} color="#fff" />
            <Text style={styles.statValue}>{stats?.total_customers || 0}</Text>
            <Text style={styles.statLabel}>{t('customers')}</Text>
          </View>
        </View>
      </View>

      {/* Alert Cards */}
      {(stats?.pending_orders || 0) > 0 && (
        <View style={[styles.alertCard, { backgroundColor: '#fff3e0' }]}>
          <Ionicons name="time-outline" size={24} color="#e67e22" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{stats?.pending_orders} {t('pendingOrders')}</Text>
            <Text style={styles.alertText}>Orders waiting for processing</Text>
          </View>
        </View>
      )}
      {(stats?.low_stock_products || 0) > 0 && (
        <View style={[styles.alertCard, { backgroundColor: '#ffebee' }]}>
          <Ionicons name="warning-outline" size={24} color="#e74c3c" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{stats?.low_stock_products} {t('lowStock')}</Text>
            <Text style={styles.alertText}>Products with stock below 10</Text>
          </View>
        </View>
      )}

      {/* Menu Grid */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('recentOrders')}</Text>
          <TouchableOpacity onPress={() => router.push('/admin/orders')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        {stats?.recent_orders && stats.recent_orders.length > 0 ? (
          stats.recent_orders.map((order, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>{order.order_number}</Text>
                <Text style={styles.orderDate}>
                  {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>€{order.total?.toFixed(2)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {order.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent orders</Text>
        )}
      </View>

      {/* Top Products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('topProducts')}</Text>
        {stats?.top_products && stats.top_products.length > 0 ? (
          stats.top_products.map((product, index) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productRank}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {getLocalizedText(product.name)}
                </Text>
              </View>
              <Text style={styles.productSold}>{product.sold} sold</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No sales data yet</Text>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#f39c12';
    case 'confirmed': return '#3498db';
    case 'processing': return '#9b59b6';
    case 'shipped': return '#1abc9c';
    case 'delivered': return '#27ae60';
    case 'cancelled': return '#e74c3c';
    default: return '#666';
  }
};

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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  menuContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  menuItem: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#e67e22',
    fontWeight: '600',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e67e22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: '#333',
  },
  productSold: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomPadding: {
    height: 24,
  },
});
