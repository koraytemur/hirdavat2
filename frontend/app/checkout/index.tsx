import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/useStore';
import { createOrder, validateDiscount, processMockPayment } from '../../src/services/api';
import { CustomerInfo } from '../../src/types';

const paymentMethods = [
  { id: 'mock', name: 'mockPayment', icon: 'card-outline' },
  { id: 'bancontact', name: 'bancontact', icon: 'card-outline' },
  { id: 'ideal', name: 'ideal', icon: 'card-outline' },
  { id: 'paypal', name: 'paypal', icon: 'logo-paypal' },
  { id: 'card', name: 'card', icon: 'card-outline' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { t, cart, getCartTotal, clearCart, appliedDiscount, setAppliedDiscount } = useStore();
  const { subtotal, tax, total } = getCartTotal();

  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('mock');
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Belgium',
  });

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setApplyingDiscount(true);
    try {
      const discount = await validateDiscount(discountCode, subtotal);
      setAppliedDiscount(discount);
      setDiscountCode('');
      Alert.alert(t('success'), 'Discount applied!');
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.detail || 'Invalid discount code');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const validateForm = () => {
    if (!customer.name.trim()) {
      Alert.alert(t('error'), 'Please enter your name');
      return false;
    }
    if (!customer.email.trim() || !customer.email.includes('@')) {
      Alert.alert(t('error'), 'Please enter a valid email');
      return false;
    }
    if (!customer.phone.trim()) {
      Alert.alert(t('error'), 'Please enter your phone number');
      return false;
    }
    if (!customer.address.trim()) {
      Alert.alert(t('error'), 'Please enter your address');
      return false;
    }
    if (!customer.city.trim()) {
      Alert.alert(t('error'), 'Please enter your city');
      return false;
    }
    if (!customer.postal_code.trim()) {
      Alert.alert(t('error'), 'Please enter your postal code');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (cart.length === 0) {
      Alert.alert(t('error'), 'Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const order = await createOrder({
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        customer,
        payment_method: selectedPayment,
      });

      // Process mock payment
      if (selectedPayment === 'mock') {
        await processMockPayment(order.id, true);
      }

      clearCart();
      router.replace({
        pathname: '/checkout/success',
        params: { orderNumber: order.order_number },
      });
    } catch (error: any) {
      Alert.alert(
        t('error'),
        error.response?.data?.detail || 'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('customerInfo')}</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('name')}</Text>
            <TextInput
              style={styles.input}
              value={customer.name}
              onChangeText={(text) => setCustomer({ ...customer, name: text })}
              placeholder="John Doe"
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              value={customer.email}
              onChangeText={(text) => setCustomer({ ...customer, email: text })}
              placeholder="john@example.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('phone')}</Text>
            <TextInput
              style={styles.input}
              value={customer.phone}
              onChangeText={(text) => setCustomer({ ...customer, phone: text })}
              placeholder="+32 XXX XXX XXX"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('address')}</Text>
            <TextInput
              style={styles.input}
              value={customer.address}
              onChangeText={(text) => setCustomer({ ...customer, address: text })}
              placeholder="Street and number"
              placeholderTextColor="#999"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>{t('city')}</Text>
              <TextInput
                style={styles.input}
                value={customer.city}
                onChangeText={(text) => setCustomer({ ...customer, city: text })}
                placeholder="City"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>{t('postalCode')}</Text>
              <TextInput
                style={styles.input}
                value={customer.postal_code}
                onChangeText={(text) => setCustomer({ ...customer, postal_code: text })}
                placeholder="1000"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Discount Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('discountCode')}</Text>
          <View style={styles.discountRow}>
            <TextInput
              style={[styles.input, styles.discountInput]}
              value={discountCode}
              onChangeText={setDiscountCode}
              placeholder="Enter code"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyDiscount}
              disabled={applyingDiscount}
            >
              {applyingDiscount ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.applyButtonText}>{t('applyDiscount')}</Text>
              )}
            </TouchableOpacity>
          </View>
          {appliedDiscount && (
            <View style={styles.appliedDiscount}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.appliedDiscountText}>
                {appliedDiscount.code} - {appliedDiscount.discount_value}
                {appliedDiscount.discount_type === 'percentage' ? '%' : '€'} off
              </Text>
              <TouchableOpacity onPress={() => setAppliedDiscount(null)}>
                <Ionicons name="close-circle" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('paymentMethod')}</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                selectedPayment === method.id && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={selectedPayment === method.id ? '#e67e22' : '#666'}
              />
              <Text
                style={[
                  styles.paymentOptionText,
                  selectedPayment === method.id && styles.paymentOptionTextSelected,
                ]}
              >
                {t(method.name as any)}
              </Text>
              {selectedPayment === method.id && (
                <Ionicons name="checkmark-circle" size={24} color="#e67e22" />
              )}
            </TouchableOpacity>
          ))}
          {selectedPayment !== 'mock' && (
            <Text style={styles.paymentNote}>
              * Real payment integration coming soon. Using test mode.
            </Text>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
            <Text style={styles.summaryValue}>€{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('tax')}</Text>
            <Text style={styles.summaryValue}>€{tax.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>{t('total')}</Text>
            <Text style={styles.totalValue}>€{total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>{t('placeOrder')}</Text>
              <Text style={styles.placeOrderPrice}>€{total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  discountRow: {
    flexDirection: 'row',
  },
  discountInput: {
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  appliedDiscount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f8f0',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  appliedDiscountText: {
    flex: 1,
    marginLeft: 8,
    color: '#27ae60',
    fontWeight: '500',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  paymentOptionSelected: {
    backgroundColor: '#fff5eb',
    borderWidth: 2,
    borderColor: '#e67e22',
  },
  paymentOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  paymentOptionTextSelected: {
    color: '#e67e22',
    fontWeight: '600',
  },
  paymentNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e67e22',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeOrderPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    opacity: 0.9,
  },
});
