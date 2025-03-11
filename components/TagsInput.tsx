import { Entypo, Ionicons } from '@expo/vector-icons';
import {
  BottomSheetFlatList,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

type TagsInputProps = {
  tags: string[];
  setTags: (tags: string[]) => void;
  inBottomSheet?: boolean;
};

export const TagsInput = ({
  tags,
  setTags,
  inBottomSheet = false,
}: TagsInputProps) => {
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
      <Text className="text-text">Tags</Text>
      <View className="flex gap-2 flex-row bg-secondary-850 p-2 rounded-xl">
        <CorrectInput
          value={newTag}
          onChangeText={setNewTag}
          className="text-text rounded-xl grow focus:outline-none"
          onSubmitEditing={handleAddTag}
          blurOnSubmit={false}
        />
        <Pressable
          className="text-text bg-primary p-2 rounded-xl self-end"
          onPress={handleAddTag}
        >
          <Entypo name="plus" size={18} className="text-background" />
        </Pressable>
      </View>
      <FlatList
        data={tags}
        renderItem={({ item: tag }) => (
          <View className="bg-secondary-850 flex flex-row gap-1 py-2 px-4 rounded-xl items-center mr-2">
            <Text className="text-text">{tag} </Text>
            <Pressable onPress={() => handleRemoveTag(tag)}>
              <Text className="text-text">
                <Ionicons name="close" size={18} />
              </Text>
            </Pressable>
          </View>
        )}
        horizontal
      />
    </View>
  );
};
