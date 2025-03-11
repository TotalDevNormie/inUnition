import {
  MarkdownStyle,
  MarkdownTextInput,
  parseExpensiMark,
} from '@expensify/react-native-live-markdown';
import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  TextInput,
  View,
  StyleSheet,
  TextInput as NativeTextInput,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import markdownRules from '../MarkdownRenderRules';
import { useNoteStore } from '../../utils/manageNotes';

export default function NoteInput({ uuid }: { uuid: string }) {
  const { notes, activeNotesArray, saveNote } = useNoteStore();
  const note = notes[uuid];

  const titleInputRef = useRef<NativeTextInput>(null);
  const contentInputRef = useRef<MarkdownTextInput>(null);

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.value = note?.title || '';
    }
    if (contentInputRef.current) {
      contentInputRef.current.value = note?.content || '';
    }
  }, [note?.title, note?.content]);

  const handleTitleChange = () => {
    if (titleInputRef.current) {
      const text = titleInputRef.current.value;
      saveNote({ ...note, uuid, title: text });
    }
  };

  const handleContentChange = () => {
    if (contentInputRef.current) {
      const text = contentInputRef.current.value;
      saveNote({ ...note, uuid, content: text });
    }
  };

  return (
    <View className="h-[50rem] flex grow flex-col gap-4 px-8 py-4 ">
      <TextInput
        ref={titleInputRef}
        defaultValue={note?.title || ''}
        onChange={handleTitleChange}
        className="text-xl text-text"
      />
      <View className="h-[2px] bg-secondary rounded-xl"></View>
      <MarkdownTextInput
        ref={contentInputRef}
        defaultValue={note?.content || ''}
        onChange={handleContentChange}
        multiline
        textAlignVertical="top"
        parser={parseExpensiMark}
        markdownStyle={markdownStyle}
        style={{ flex: 1, borderWidth: 0, color: '#E9F1EF' }}
      />
    </View>
  );
}

const markdownStyle: MarkdownStyle = {
  syntax: {
    color: '#E9F1EF',
  },
  link: {
    color: '#E9F1EF',
  },
  h1: {
    fontSize: 25,
  },
  emoji: {
    fontSize: 20,
  },
  blockquote: {
    borderColor: 'gray',
    borderWidth: 6,
    marginLeft: 6,
    paddingLeft: 6,
  },
  code: {
    fontSize: 20,
    color: '#E9F1EF',
    backgroundColor: '#313749',
  },
  pre: {
    fontSize: 20,
    color: '#E9F1EF',
    backgroundColor: 'lightgray',
  },
};
