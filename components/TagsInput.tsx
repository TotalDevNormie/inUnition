import { Entypo, Ionicons } from '@expo/vector-icons';
import { BottomSheetFlatList, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

type TagsInputProps = {
  tags: string[];
  setTags: (tags: string[]) => void;
  inBottomSheet?: boolean;
};

export const TagsInput = ({ tags, setTags, inBottomSheet = false }: TagsInputProps) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag) {
      setTags([...new Set([...tags, newTag])]);
      setNewTag('');
    }
  };

  const CorrectInput = inBottomSheet ? BottomSheetTextInput : TextInput;

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };
  return (
    <View className="flex gap-2">
      <Text className="text-text">Tags </Text>
      <View className="flex flex-row gap-2 rounded-xl bg-secondary-850 p-2">
        <CorrectInput
          value={newTag}
          onChangeText={setNewTag}
          className="grow rounded-xl text-text focus:outline-none"
          onSubmitEditing={handleAddTag}
          blurOnSubmit={false}
        />
        <Pressable className="self-end rounded-xl bg-primary p-2 text-text" onPress={handleAddTag}>
          <Entypo name="plus" size={18} className="text-background" />
        </Pressable>
      </View>
      <FlatList
        data={tags}
        renderItem={({ item: tag }) => (
          <View className="mr-2 flex flex-row items-center gap-1 rounded-xl bg-secondary-850 px-4 py-2">
            <Text className="text-text">{tag} </Text>
            <Pressable onPress={() => handleRemoveTag(tag)}>
              <Text className="text-text">
                <Ionicons name="close" size={18} />{' '}
              </Text>
            </Pressable>
          </View>
        )}
        horizontal
      />
    </View>
  );
};
