import { useState } from 'react';
import { Pressable, View, Platform, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import WebSearchPopup from './WebSearchPopup';
import MobileSearchPopup from './MobileSearchPopup';

export default function SearchButton({ collapsed }: { collapsed: boolean }) {
  const [searchVisible, setSearchVisible] = useState(false);

  const openSearch = () => {
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
        <View className="p-2 flex flex-row gap-2">
          <Text className="text-text">
            <FontAwesome5 name="search" size={20} />
          </Text>
          {Platform.OS === 'web' && (
            <Text className={`${collapsed ? 'hidden' : ''} text-text`}>
              Search
            </Text>
          )}
        </View>
      </Pressable>

      {/* Include the appropriate search component based on platform */}
      {Platform.OS === 'web' ? (
        <WebSearchPopup />
      ) : (
        <MobileSearchPopup
          visible={searchVisible}
          setVisible={setSearchVisible}
        />
      )}
    </>
  );
}
