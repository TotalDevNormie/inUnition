import React, { useState, useEffect } from 'react';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { useAuth } from '../../../components/auth/authContext';
import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import 'react-native-get-random-values';
import { v4 as uuidv4, parse } from 'uuid';
import { getAllNotes, getNote, Note, saveNote } from '../../../functions/notes/manageNotes';

export default function Notes() {
  const { uuid } = useLocalSearchParams();
  const router = useRouter();
  const [isInvalidUUID, setIsInvalidUUID] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    // This effect runs when noteId changes
    setTitle('New Note');
    setContent('');
    try {
      const parsedId = parse(uuid as string);
      setIsInvalidUUID(false);
    } catch (error) {
      setIsInvalidUUID(true);
    }
  }, [uuid]);

  const { data: note } = useQuery({
    queryKey: ['notes', uuid],
    queryFn: async () => {
      const noteFromDB = await getNote(uuid as string);
      if (noteFromDB) {
        setContent(noteFromDB.content);
        setTitle(noteFromDB.title);
      }

      return noteFromDB;
    },
  });

  const { data: notes } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      return await getAllNotes();
    },
  });

  console.log(notes);

  const { error: saveError, mutate: save } = useMutation({
    mutationKey: ['notes'],
    mutationFn: async (note: Note) => {
      return await saveNote(note, uuid as string);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  const handleSave = () => {
    console.log(`Saving note ${uuid} with content: `, {
      title,
      content,
    });
    save({
      title,
      content,
    } as Note);
  };

  if (isInvalidUUID) return <Redirect href="./" />

  return (
    <View>
      <TextInput
        value={title}
        onChangeText={setTitle}
      />
      <TextInput value={content} onChangeText={setContent} />
      <Pressable onPress={handleSave} className='text-text bg-secondary p-2 rounded-xl'><Text>Save</Text></Pressable>

      <Text className='text-text text-2xl'>Note List:</Text>
      {notes && Object.keys(notes).map(noteUUID => (
        <Link key={noteUUID} href={`./${noteUUID}`} className='text-text text-bold'>
          {notes[noteUUID].title}
        </Link>
      ))}
    </View>
  );
}