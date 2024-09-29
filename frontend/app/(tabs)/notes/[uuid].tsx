import React, { useState, useEffect } from 'react';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { useAuth } from '../../../components/auth/authContext';
import { Link, Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import 'react-native-get-random-values';
import { v4 as uuidv4, parse } from 'uuid';
import { deleteNote, getAllNotes, getNote, Note, saveNote } from '../../../utils/manageNotes';
import { Ionicons } from '@expo/vector-icons';
import { set } from 'react-hook-form';

export default function Notes() {
  const { uuid } = useLocalSearchParams();
  const router = useRouter();
  const [isInvalidUUID, setIsInvalidUUID] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
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
        setTags(noteFromDB.tags);
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

  const { error: saveError, mutate: save } = useMutation({
    mutationKey: ['notes'],
    mutationFn: async (note: Note) => {
      return await saveNote(note, tags, uuid as string);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    }
  });

  const { error: deleteError, mutate: deleteNoteMutation } = useMutation({
    mutationKey: ['notes'],
    mutationFn: async (noteUUID: string) => {
      return await deleteNote(noteUUID);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      router.push('./');
    }
  });

  const handleAddTag = () => {
    if (newTag) {
      setTags([...new Set([...tags, newTag])]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    save({
      title,
      content,
    } as Note);
  };

  const handleDelete = () => {
    deleteNoteMutation(uuid as string);
  };

  if (isInvalidUUID) return <Redirect href="./" />

  return (
    <View>
      <View className='flex flex-row flex-wrap gap-2'>
        <Link href="./" className='text-text bg-accent p-2 rounded-xl'>New Note</Link>
        <Pressable onPress={handleDelete} className='text-text bg-red-500 p-2 rounded-xl flex-'><Text>Delete </Text></Pressable>
      </View>

      <View className='flex flex-col gap-2 my-4'>

        <TextInput
          value={title}
          onChangeText={setTitle}
          className='bg-background-200 p-2 rounded-xl'
          style={{
            color: 'white',
          }}
        />
        <TextInput value={content} onChangeText={setContent}
          className='bg-background-200 p-2 rounded-xl'
          style={{
            color: 'white',
          }}
        />
        <Text className='text-text'>Tags:</Text>

        <View
          className='bg-background-200 p-2 rounded-xl flex flex-row gap-2'
        >
          <View className='flex flex-row gap-2 flex-1 flex-wrap'>
            {tags.map((tag, index) => (
              <View key={index} className='bg-gray-700 flex flex-row gap-1 px-2 rounded-xl items-center'>
                <Text className='text-text'>{tag} </Text>
                <Pressable onPress={() => handleRemoveTag(tag)}><Text className='color-text'><Ionicons name="close" size={18} /></Text></Pressable>
              </View>
            ))}
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              className='bg-background-200 rounded-xl flex-1 focus:outline-none'
              onSubmitEditing={handleAddTag}
              blurOnSubmit={false}
              style={{
                color: 'white',
              }}
            />
          </View>
          <Pressable className='text-text bg-accent px-2 py-1 rounded-xl self-end' onPress={handleAddTag}><Text className='text-text'>Add Tag</Text></Pressable>
        </View>
      </View>

      <Pressable onPress={handleSave} className='text-text bg-secondary p-2 rounded-xl'><Text>Save</Text></Pressable>

      <Text className='text-text text-2xl'>Note List:</Text>
      {notes && Object.keys(notes).map(noteUUID => (
        <Link key={noteUUID} href={`./${noteUUID}`} className='text-text text-bold'>
          {notes[noteUUID].title + ' '}
        </Link>
      ))}
    </View>
  );
}