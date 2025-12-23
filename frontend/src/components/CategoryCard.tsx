import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { useStore } from '../store/useStore';

interface CategoryCardProps {
  category: Category;
  onPress: () => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
  const { getLocalizedText } = useStore();

  const getCategoryIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('tool') || nameLower.includes('gereedschap') || nameLower.includes('alet')) return 'hammer-outline';
    if (nameLower.includes('electric') || nameLower.includes('elektr')) return 'flash-outline';
    if (nameLower.includes('paint') || nameLower.includes('verf') || nameLower.includes('boya')) return 'color-palette-outline';
    if (nameLower.includes('fastener') || nameLower.includes('bevestig') || nameLower.includes('schroev') || nameLower.includes('vida')) return 'construct-outline';
    if (nameLower.includes('plumb') || nameLower.includes('sanitair') || nameLower.includes('tesisat')) return 'water-outline';
    return 'cube-outline';
  };

  const name = getLocalizedText(category.name);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={getCategoryIcon(name)}
          size={32}
          color="#e67e22"
        />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff5eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
