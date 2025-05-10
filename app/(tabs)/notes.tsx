import { FontAwesome5 } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import moment from 'moment';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native'; // Import useWindowDimensions
import MasonryList from 'reanimated-masonry-list';

import { Note, useNoteStore } from '../../utils/manageNotes';

import 'react-native-get-random-values';
import { v4 } from 'uuid';
import { useState } from 'react';

export default function Notes() {
  const { activeNotesArray } = useNoteStore();
  const { width } = useWindowDimensions(); // Use the hook

  const maxColumnWidth = width > 500 ? 300 : 175;
  const columnCount = Math.max(1, Math.floor(width / maxColumnWidth)); // Ensure at least 1 column

  const newNote = () => {
    const newNoteUUID = v4();
    router.push(`/note/${newNoteUUID}`);
  };

  const NewButton = () => (
    <Pressable onPress={() => newNote()}>
      <View className="rounded-xl bg-primary pb-5 pl-5 pr-4 pt-4 text-background">
        <FontAwesome5 name="edit" size={24} />
      </View>
    </Pressable>
  );

  return (
    <View className="mb-2 flex flex-1 flex-col overflow-hidden rounded-xl px-4">
      <View className="mb-4 flex flex-row items-center justify-between gap-4">
        <Text className="text-3xl text-text">Notes </Text>
        {Platform.OS == 'web' && <NewButton />}
      </View>
      <View className="flex-1 overflow-hidden rounded-xl">
        <MasonryList
          data={activeNotesArray()}
          renderItem={({ item }) => <NoteCard note={item as Note} />}
          numColumns={columnCount}
          ListEmptyComponent={<Text className="py-10 text-center text-text">No notes </Text>}
          keyExtractor={({ item }: { item: Note }): string => item?.uuid}
          style={{ gap: 16 }}
        />
      </View>
      {Platform.OS !== 'web' && (
        <View className="absolute bottom-0 right-4">
          <NewButton />
        </View>
      )}
    </View>
  );
}
const NoteCard = ({ note }: { note: Note }) => (
  <Pressable onPress={() => router.push(`/note/${note.uuid}`)} key={note.uuid}>
    <View className="mb-4 flex flex-col gap-4 rounded-2xl bg-secondary-850 p-4">
      {note?.title && <Text className="text-xl text-text">{note.title} </Text>}
      {note?.content && (
        <Text className="max-h-[12rem] overflow-hidden text-text">
          {note?.content?.length > 200 ? note?.content?.slice(0, 197) + '...' : note?.content}{' '}
        </Text>
      )}
      <View>
        <Text className="text-text">{moment(note?.createdAt).format('DD.MM.YYYY')} </Text>
        <Text className="text-accent">Last edited {moment(note.updatedAt).fromNow()} </Text>
        {note?.endsAt && <Text className="text-primary">Due {moment(note.endsAt).fromNow()} </Text>}
      </View>
    </View>
  </Pressable>
);
