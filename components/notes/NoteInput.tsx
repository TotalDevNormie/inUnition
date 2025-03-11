import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  MarkdownStyle,
  MarkdownTextInput,
  parseExpensiMark,
} from '@expensify/react-native-live-markdown';
import { useNoteStore } from '../../utils/manageNotes';

export default function NoteInput({ uuid }: { uuid: string }) {
  const { notes, saveNote } = useNoteStore();
  const note = notes[uuid] || { uuid, title: '', content: '' };

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  useLayoutEffect(() => {
    setTitle(note.title || '');
    setContent(note.content || '');
  }, []);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    saveNote({ uuid, title: text });
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    saveNote({ uuid, content: text });
  };

  return (
    <View className="h-full flex grow flex-col gap-4 px-8 py-4 ">
      <TextInput
        value={title}
        onChangeText={handleTitleChange}
        placeholder="Title"
        className="text-text text-2xl"
        placeholderTextColor="#888"
      />
      <View className="h-[2px] bg-secondary" />
      <MarkdownTextInput
        value={content}
        onChangeText={handleContentChange}
        multiline
        numberOfLines={10}
        textAlignVertical="top"
        parser={parseExpensiMark}
        markdownStyle={markdownStyle}
        style={{ flex: 1, color: '#E9F1EF', borderWidth: 0, height: '100%' }}
        placeholder="Content"
        placeholderTextColor="#888"
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
