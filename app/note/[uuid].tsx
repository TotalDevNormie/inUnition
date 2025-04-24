import { NotePage, NoteParent } from '../../components/notes/NoteParent';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoteInput from '../../components/notes/NoteInput';
import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { AntDesign, FontAwesome5 } from '@expo/vector-icons';
import NoteSettings from '~/components/notes/NoteSettings';
import { Link, router } from 'expo-router';
import { ScrollView, Pressable, Text, View, useWindowDimensions } from 'react-native';
import 'react-native-get-random-values';

const Note = () => <NoteParent NotePageContent={NotePageContent} />;

const NotePageContent: NotePage = ({ uuid }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [settingsOpen]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index == -1) setSettingsOpen(false);
  }, []);
  return (
    <View className={`mb-2 flex flex-1 flex-col overflow-hidden rounded-xl px-4`}>
      <View className="flex flex-row justify-between px-4">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text">
            <AntDesign name="arrowleft" size={24} />{' '}
          </Text>
        </Pressable>
        <View className="flex flex-row gap-2">
          <Pressable className="p-2">
            <Text className="text-text"> </Text>
          </Pressable>
          <Pressable className="p-2" onPress={() => setSettingsOpen(!settingsOpen)}>
            <Text className="text-text">
              <Ionicons name="settings" size={24} />{' '}
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView>
        <NoteInput uuid={uuid} />
      </ScrollView>
      <BottomSheet
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        index={-1}
        enablePanDownToClose
        handleStyle={{
          backgroundColor: '#121517',
          borderTopWidth: 2,
          borderTopColor: '#313749',
        }}
        handleIndicatorStyle={{ backgroundColor: '#313749' }}
        backgroundStyle={{ backgroundColor: '#121517' }}>
        <BottomSheetView>
          <NoteSettings uuid={uuid} />
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default Note;
