import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View, Platform, Text } from 'react-native';

import MobileSearchPopup from './MobileSearchPopup';
import WebSearchPopup from './WebSearchPopup';
import { useSearchStore } from '../utils/useSearchStore';

export default function SearchButton({ collapsed = false }: { collapsed?: boolean }) {
  const [searchVisible, setSearchVisible] = useState(false);
  const { setSearchTerm, search } = useSearchStore();

  const openSearch = () => {
    // Reset search term and perform a fresh search
    setSearchTerm('');
    search();

    // For web, we'll use the Ctrl+K keyboard event simulation
    if (Platform.OS === 'web') {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    } else {
      // For mobile, we'll directly control the visibility
      setSearchVisible(true);
    }
  };

  return (
    <>
      <Pressable onPress={openSearch}>
        <View className="flex flex-row gap-2 p-2">
          <Text className="text-text">
            <FontAwesome5 name="search" size={20} />{' '}
          </Text>
          {Platform.OS === 'web' && (
            <Text className={`${collapsed ? 'hidden' : ''} text-text`}>Search </Text>
          )}
        </View>
      </Pressable>

      {/* Include the appropriate search component based on platform */}
      {Platform.OS === 'web' ? (
        <WebSearchPopup />
      ) : (
        <MobileSearchPopup visible={searchVisible} setVisible={setSearchVisible} />
      )}
    </>
  );
}
