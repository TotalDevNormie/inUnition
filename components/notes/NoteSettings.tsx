import 'react-native-get-random-values';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { v4 } from 'uuid';

import DueDateInput from '../DueDateInput';
import { TagsInput } from '../TagsInput';

import { useNoteStore } from '~/utils/manageNotes';

type Props = {
  uuid: string;
};

export default function NoteSettings({ uuid }: Props) {
  const { deleteNote, saveNote, notes } = useNoteStore();
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      setTags(notes[uuid]?.tags || []);
      setDueDate(notes[uuid]?.endsAt || '');
      isFirstRender.current = false;
      return;
    }

    saveNote({ uuid, tags, endsAt: dueDate });
  }, [dueDate, tags]);

  const handleDelete = () => {
    deleteNote(uuid);
    router.back();
  };

  return (
    <View className="flex flex-col gap-4 p-8 pb-16">
      <View className="flex flex-row gap-2">
        <Pressable className="flex-1 rounded-xl bg-red-500 p-2" onPress={handleDelete}>
          <Text className="text-center text-text">Delete Note </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/note/${v4()}`)}
          className="flex-1 rounded-xl bg-accent p-2">
          <Text className="text-center text-background">New Note </Text>
        </Pressable>
      </View>
      <TagsInput tags={tags} setTags={setTags} />
      <DueDateInput date={dueDate} setDate={setDueDate} />
    </View>
  );
}
