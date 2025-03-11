import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NotePage, NoteParent } from '../../components/notes/NoteParent';
import { useCallback, useEffect, useRef, useState } from 'react';
import NoteInput from '../../components/notes/NoteInput';
import Ionicons from '@expo/vector-icons/Ionicons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { TagsInput } from '../../components/TagsInput';
import DueDateInput from '../../components/DueDateInput';
import { AntDesign, Entypo, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import 'react-native-get-random-values';
import { v4 } from 'uuid';
import { useNoteStore } from '../../utils/manageNotes';

const Note = () => <NoteParent NotePageContent={NotePageContent} />;

const NotePageContent: NotePage = ({ uuid }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { deleteNote } = useNoteStore();

  useEffect(() => {
    if (settingsOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [settingsOpen]);

  //callbacks
  const handleSheetChanges = useCallback((index: number) => {
    if (index == -1) setSettingsOpen(false);
  }, []);
  return (
    <View className="flex grow min-h-screen">
      <View className="flex flex-row justify-between px-8">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text">
            <AntDesign name="arrowleft" size={24} />
          </Text>
        </Pressable>
        <View className="flex flex-row gap-2">
          <Pressable className="p-2">
            <Text className="text-text"></Text>
          </Pressable>
          <Pressable
            className="p-2"
            onPress={() => setSettingsOpen(!settingsOpen)}
          >
            <Text className="text-text">
              <Ionicons name="settings" size={24} />
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView className="flex grow h-full">
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
        backgroundStyle={{ backgroundColor: '#121517' }}
      >
        <BottomSheetView>
          <View className="flex flex-col p-8 pb-10 gap-4">
            <View className="flex flex-row gap-2">
              <Pressable
                className="bg-red-500 p-2 rounded-xl flex-1"
                onPress={() => deleteNote(uuid)}
              >
                <Text className="text-text text-center">Delete Note </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push(`/note/${v4()}`)}
                className="bg-accent p-2 rounded-xl flex-1"
              >
                <Text className="text-background text-center">New Note</Text>
              </Pressable>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default Note;
