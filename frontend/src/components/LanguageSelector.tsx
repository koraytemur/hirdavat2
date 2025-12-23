import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { Language } from '../types';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'nl', name: 'Nederlands', flag: '🇧🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ visible, onClose }) => {
  const { language, setLanguage, t } = useStore();

  const handleSelect = (code: Language) => {
    setLanguage(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('language')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={languages}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.languageItem,
                  language === item.code && styles.selectedItem,
                ]}
                onPress={() => handleSelect(item.code)}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    language === item.code && styles.selectedText,
                  ]}
                >
                  {item.name}
                </Text>
                {language === item.code && (
                  <Ionicons name="checkmark" size={24} color="#e67e22" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#fff5eb',
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedText: {
    fontWeight: 'bold',
    color: '#e67e22',
  },
});
