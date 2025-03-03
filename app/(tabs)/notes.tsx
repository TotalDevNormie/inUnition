import { FontAwesome5 } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { Note, useNoteStore } from '../../utils/manageNotes';
import moment from 'moment';
import MasonryList from 'reanimated-masonry-list';
import 'react-native-get-random-values';
import { v4 } from 'uuid';

export default function Notes() {
  const { activeNotesArray } = useNoteStore();
  const windowWidth = Dimensions.get('window').width;
  const maxColumnWidth = 250;
  const possibleColumnCount = Math.floor(windowWidth / maxColumnWidth);
  const columnCount: number = possibleColumnCount < 2 ? 2 : possibleColumnCount;

  const newNote = () => {
    const newNoteUUID = v4();

    router.push(`note/${newNoteUUID}`);
  };

  return (
    <View className="flex flex-1 mx-8 mb-2 rounded-xl overflow-hidden ">
      <Text className="text-text text-3xl mb-4">Notes</Text>
      <View className="flex-1 rounded-xl overflow-hidden borer-2 border-primary">
        <MasonryList
          data={activeNotesArray()}
          renderItem={({ item }) => <NoteCard note={item as Note} />}
          numColumns={columnCount}
          ListEmptyComponent={
            <Text className="text-text text-center py-10">No notes</Text>
          }
          keyExtractor={({ item }: { item: Note }): string => item?.uuid}
          className="android:-ml-4 rounded-xl "
        />
      </View>
      <View className="bottom-0 right-0 absolute">
        <Pressable onPress={() => newNote()}>
          <View className="text-background pl-5 pt-4 pb-5 pr-4  rounded-xl bg-primary">
            <FontAwesome5 name="edit" size={24} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const NoteCard = ({ note }: { note: Note }) => {
  return (
    <Pressable
      onPress={() => router.push(`/note/${note.uuid}`)}
      key={note.uuid}
    >
      <View
        className={`bg-secondary-850 p-4 rounded-2xl flex flex-col gap-4 ml-4 mb-4`}
      >
        {note?.title && <Text className="text-xl text-text">{note.title}</Text>}
        {note?.content && (
          <Text className="text-text max-h-[12rem] overflow-hidden">
            {note?.content?.length > 200
              ? note?.content?.slice(0, 197) + '...'
              : note?.content}
          </Text>
        )}
        <View>
          <Text className="text-text">
            {moment(note?.createdAt).format('DD.MM.YYYY')}
          </Text>
          <Text className="text-accent">
            Last edited {moment(note.updatedAt).fromNow()}
          </Text>
          {note?.endsAt && (
            <Text className="text-primary">
              Due {moment(note.endsAt).fromNow()}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};
