import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NoteParent } from "../../components/notes/NoteParent";
import { useCallback, useEffect, useRef, useState } from "react";
import NoteInput from "../../components/notes/NoteInput";
import Ionicons from "@expo/vector-icons/Ionicons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { TagsInput } from "../../components/TagsInput";
import DueDateInput from "../../components/DueDateInput";
import { AntDesign, Entypo, FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import "react-native-get-random-values";
import { v4 } from "uuid";

export default function Note() {
  return <NoteParent {...{ NotePageContent }} />;
}

const NotePageContent = ({
  content,
  setContent,
  title,
  setTitle,
  handleSave,
  isMarkdown,
  setIsMarkdown,
  tags,
  setTags,
  dueDate,
  setDueDate,
  handleDelete,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (settingsOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [settingsOpen]);

  // callbacks
  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
    if (index == -1) setSettingsOpen(false);
  }, []);
  return (
    <View className="flex grow min-h-screen">
      <View className="flex flex-row justify-between px-8">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text">
            <AntDesign name="arrowleft" size={24} />
          </Text>
        </Pressable>
        <View className="flex flex-row gap-2">
          <Pressable className="p-2" onPress={() => setIsMarkdown(!isMarkdown)}>
            <Text className="text-text">
              {isMarkdown ? (
                <FontAwesome5 name="markdown" size={24} />
              ) : (
                <Entypo name="text" size={24} />
              )}
            </Text>
          </Pressable>
          <Pressable
            className="p-2"
            onPress={() => setSettingsOpen(!settingsOpen)}
          >
            <Text className="text-text">
              <Ionicons name="settings" size={24} />
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView className="flex grow h-full">
        <NoteInput
          {...{ content, setContent, title, setTitle, handleSave, isMarkdown }}
        />
      </ScrollView>
      <BottomSheet
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        index={-1}
        enablePanDownToClose
        handleStyle={{
          backgroundColor: "#121517",
          borderTopWidth: 2,
          borderTopColor: "#313749",
        }}
        handleIndicatorStyle={{ backgroundColor: "#313749" }}
        backgroundStyle={{ backgroundColor: "#121517" }}
      >
        <BottomSheetView>
          <View className="flex flex-col p-8 pb-10 gap-4">
            <View className="flex flex-row gap-2">
              <Pressable
                onPress={handleDelete}
                className="bg-red-500 p-2 rounded-xl flex-1"
              >
                <Text className="text-text text-center">Delete Note </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push(`/note/${v4()}`)}
                className="bg-accent p-2 rounded-xl flex-1"
              >
                <Text className="text-background text-center">New Note</Text>
              </Pressable>
            </View>
            <TagsInput tags={tags} setTags={setTags} inBottomSheet />
            <DueDateInput date={dueDate} setDate={setDueDate} />
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};
