import { useState } from 'react';
import { TextInput, View, Text } from 'react-native';
import {
  MarkdownStyle,
  MarkdownTextInput,
  parseExpensiMark,
} from '@expensify/react-native-live-markdown';
import { useNoteStore } from '../../utils/manageNotes';
import { ScrollView } from 'react-native-gesture-handler';

export default function NoteInput({ uuid }: { uuid: string }) {
  const { notes, saveNote } = useNoteStore();
  const note = notes[uuid] || { uuid, title: '', content: '' };

  // Initialize local state from the note.
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleTitleChange = (text: string) => {
    setTitle(text);
    saveNote({ uuid, title: text });
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    saveNote({ uuid, content: text });
  };

  return (
    <View className="flex grow flex-col gap-4 px-8 py-4">
      {note?.tags && <Text className='text-text'>Tags: <Text className="text-primary">{note.tags.join(', ')}</Text></Text>}
      <TextInput
        value={title}
        onChangeText={handleTitleChange}
        placeholder="Title"
        className="text-2xl text-text"
        placeholderTextColor="#888"
      />
      <View className="my-4 h-[2px] bg-secondary" />
      <MarkdownTextInput
        value={content}
        onChangeText={handleContentChange}
        multiline
        textAlignVertical="top"
        markdownStyle={markdownStyle}
        parser={parseExpensiMark}
        style={{
          maxHeight: 9999,
          color: '#E9F1EF',
          borderWidth: 0,
          flex: 1,
        }}
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
    borderColor: '#313749',
    borderWidth: 4,
    marginLeft: 4,
    paddingLeft: 4,
  },
  code: {
    fontSize: 18,
    fontFamily: 'monospace',
    color: '#E9F1EF',
    backgroundColor: '#313749',
  },
  pre: {
    fontSize: 20,
    color: '#E9F1EF',
    backgroundColor: '#313749',
  },
};
