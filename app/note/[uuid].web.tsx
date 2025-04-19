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
import { useNoteStore } from '../../utils/manageNotes';
import NoteSettings from '~/components/notes/NoteSettings';

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
    <View className="flex grow flex-row portrait:flex-col">
      <View className="flex flex-1 ">
        <NoteInput uuid={uuid} />
      </View>
      <View className="flex min-w-[20rem] landscape:flex-1 border-l-[2px] border-l-secondary portrait:border-l-[0px] portrait:border-t-[2px] portrait:border-t-secondary">
        <View className="sticky top-0">
          <NoteSettings uuid={uuid} />
        </View>
      </View>
    </View>
  );
};

export default Note;
