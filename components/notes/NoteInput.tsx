import {
  MarkdownTextInput,
  parseExpensiMark,
} from '@expensify/react-native-live-markdown';
import { useEffect, useRef } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import markdownRules from '../MarkdownRenderRules';
import { useNoteStore } from '../../utils/manageNotes';

export default function NoteInput({ uuid }: { uuid: string }) {
  const { notes, activeNotesArray, saveNote } = useNoteStore();
  const note = notes[uuid];
  console.log(activeNotesArray);

  const handleChange = (text: string, isTitle: boolean) => {
    if (isTitle) {
      saveNote({ ...note, uuid, title: text });
    } else {
      saveNote({ ...note, uuid, content: text });
    }
  };
  return (
    <View className="h-[50rem] flex grow flex-col gap-4 px-8 py-4 ">
      <TextInput
        value={note?.title}
        onChangeText={(text) => handleChange(text, true)}
        className="text-xl text-text "
      />
      <View className="h-[2px] bg-secondary rounded-xl"></View>
      <TextInput
        value={note?.content}
        onChangeText={(text) => handleChange(text, false)}
        className="text-text grow"
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}
