import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../types';
import { useStore } from '../store/useStore';

interface CartItemProps {
  item: CartItemType;
}

export const CartItemCard: React.FC<CartItemProps> = ({ item }) => {
  const { getLocalizedText, t, updateQuantity, removeFromCart } = useStore();

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {item.product.images && item.product.images.length > 0 ? (
          <Image
            source={{ uri: item.product.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="cube-outline" size={32} color="#ccc" />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {getLocalizedText(item.product.name)}
        </Text>
        <Text style={styles.price}>€{item.product.price.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
          >
            <Ionicons name="add" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.product.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
        <Text style={styles.totalPrice}>
          €{(item.product.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    color: '#333',
  },
  rightSection: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  removeButton: {
    padding: 4,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
});
