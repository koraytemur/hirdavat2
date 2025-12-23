import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../src/store/useStore';
import { getDiscounts, createDiscount, deleteDiscount } from '../../src/services/api';
import { Discount, MultilingualText } from '../../src/types';

export default function AdminDiscountsScreen() {
  const { t, getLocalizedText } = useStore();
  
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: { nl: '', fr: '', en: '', tr: '' } as MultilingualText,
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
  });

  const loadDiscounts = async () => {
    try {
      const data = await getDiscounts();
      setDiscounts(data);
    } catch (error) {
      console.error('Error loading discounts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDiscounts();
  };

  const openAddModal = () => {
    setFormData({
      code: '',
      name: { nl: '', fr: '', en: '', tr: '' },
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_uses: '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.discount_value) {
      Alert.alert('Error', 'Please fill in required fields (Code, Discount Value)');
      return;
    }

    setSaving(true);
    try {
      const discountData = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: { nl: '', fr: '', en: '', tr: '' },
        discount_type: formData.discount_type as 'percentage' | 'fixed',
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_uses: parseInt(formData.max_uses) || 0,
        used_count: 0,
        is_active: true,
        valid_from: new Date().toISOString(),
      };

      await createDiscount(discountData);
      setModalVisible(false);
      loadDiscounts();
      Alert.alert('Success', 'Discount created');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save discount');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (discount: Discount) => {
    Alert.alert(
      'Delete Discount',
      `Are you sure you want to delete "${discount.code}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDiscount(discount.id);
              loadDiscounts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete discount');
            }
          },
        },
      ]
    );
  };

  const renderDiscount = ({ item }: { item: Discount }) => (
    <View style={styles.discountCard}>
      <View style={styles.discountIcon}>
        <Ionicons name="pricetag" size={24} color="#e74c3c" />
      </View>
      <View style={styles.discountInfo}>
        <Text style={styles.discountCode}>{item.code}</Text>
        <Text style={styles.discountValue}>
          {item.discount_type === 'percentage' ? `${item.discount_value}% off` : `€${item.discount_value} off`}
        </Text>
        {item.min_order_amount > 0 && (
          <Text style={styles.discountMin}>Min: €{item.min_order_amount}</Text>
        )}
        <Text style={styles.discountUsage}>
          Used: {item.used_count}{item.max_uses > 0 ? `/${item.max_uses}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
        <Ionicons name="trash-outline" size={20} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e67e22" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={discounts}
        keyExtractor={(item) => item.id}
        renderItem={renderDiscount}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e67e22']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No discounts yet</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Discount</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.code}
                onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                placeholder="SUMMER2025"
                autoCapitalize="characters"
              />
              
              <Text style={styles.inputLabel}>Name (EN)</Text>
              <TextInput
                style={styles.input}
                value={formData.name.en}
                onChangeText={(text) => setFormData({ ...formData, name: { ...formData.name, en: text } })}
                placeholder="Summer Sale"
              />
              
              <Text style={styles.inputLabel}>Discount Type</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.discount_type === 'percentage' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, discount_type: 'percentage' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.discount_type === 'percentage' && styles.typeButtonTextActive,
                    ]}
                  >
                    Percentage (%)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.discount_type === 'fixed' && styles.typeButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, discount_type: 'fixed' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.discount_type === 'fixed' && styles.typeButtonTextActive,
                    ]}
                  >
                    Fixed (€)
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.inputLabel}>Discount Value *</Text>
              <TextInput
                style={styles.input}
                value={formData.discount_value}
                onChangeText={(text) => setFormData({ ...formData, discount_value: text })}
                placeholder="10"
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Min Order Amount (€)</Text>
              <TextInput
                style={styles.input}
                value={formData.min_order_amount}
                onChangeText={(text) => setFormData({ ...formData, min_order_amount: text })}
                placeholder="0"
                keyboardType="decimal-pad"
              />
              
              <Text style={styles.inputLabel}>Max Uses (0 = unlimited)</Text>
              <TextInput
                style={styles.input}
                value={formData.max_uses}
                onChangeText={(text) => setFormData({ ...formData, max_uses: text })}
                placeholder="0"
                keyboardType="number-pad"
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  discountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  discountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffebee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  discountCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  discountValue: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
    marginTop: 2,
  },
  discountMin: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  discountUsage: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e67e22',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  typeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#e67e22',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  modalFooter: {
    paddingVertical: 20,
  },
  saveButton: {
    backgroundColor: '#e67e22',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
