import { FontAwesome5 } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import moment from 'moment';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Note } from '~/utils/manageNotes';
import 'react-native-get-random-values';
import { v4 } from 'uuid';

type Props = {
  notes: Note[];
};

export default function NotesSlider({ notes }: Props) {
  return (
    <View className="overflow-hidden rounded-xl">
      <FlatList
        data={notes}
        horizontal
        className="rounded-2xl"
        contentContainerStyle={{ gap: 8 }}
        ListEmptyComponent={
          <View>
            <Link
              className="rounded-xl bg-primary p-2 text-center color-background"
              href={`/note/${v4()}`}>
              No notes, create one
            </Link>
          </View>
        }
        renderItem={({ item: note }) => (
          <Pressable
            onPress={() => router.push(`/note/${note.uuid}`)}
            key={note.uuid}
            className={`bg-secondary-850 ${
              note?.endsAt && moment(note.endsAt).isAfter(moment()) ? 'border-2 border-primary' : ''
            } flex w-60 flex-col gap-2 rounded-2xl p-4 `}>
            <View className="flex flex-row gap-2">
              <Text className="flex-1 text-xl text-text">
                {note?.title && note?.title?.length > 30
                  ? note?.title.slice(0, 27) + '...'
                  : note?.title}
              </Text>
              <Text className="color-text ">
                <FontAwesome5 name="edit" size={24} />
              </Text>
            </View>
            {note?.tags && (
              <Text className="text-primary">
                {note.tags.join(', ')}
              </Text>
            )}
            <Text className="max-h-36 overflow-hidden text-text">
              {note?.content && note?.content?.length > 100
                ? note?.content.slice(0, 97) + '...'
                : note?.content}
            </Text>
            <View className="mt-auto">
              {note?.endsAt && (
                <Text className="text-primary">Due {moment(note.endsAt).fromNow()}</Text>
              )}
                <Text className="text-accent">Last edited {moment(note.updatedAt).fromNow()}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
