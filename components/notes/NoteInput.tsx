import {MarkdownTextInput, parseExpensiMark} from '@expensify/react-native-live-markdown';
import { useEffect, useRef } from "react";
import { ScrollView, TextInput, View } from "react-native";
import Markdown from "react-native-markdown-display";
import markdownRules from "../MarkdownRenderRules";

export default function NoteInput({
  content,
  setContent,
  title,
  setTitle,
  handleSave,
  isMarkdown,
}) {
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (text, isTitle) => {
    if (isTitle) {
      setTitle(text.substring(0, 100));
    } else {
      setContent(text);
    }
    console.log("changed text: ", text);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      console.log("note save callback: ", { content, text });
      const newTitle = isTitle ? text : title;
      const newContent = isTitle ? content : text;
      handleSave({ newTitle, newContent });
    }, 500);
  };

  return (
    <View className="h-[50rem] flex grow flex-col gap-4 px-8 py-4 ">
      <TextInput
        value={title}
        onChangeText={(text) => handleChange(text, true)}
        className="text-xl text-text "
      />
      <View className="h-[2px] bg-secondary rounded-xl"></View>
        <MarkdownTextInput
          value={content}
          onChangeText={(text) => handleChange(text, false)}
                parser={parseExpensiMark}
          className="text-text grow"
          multiline
          textAlignVertical="top"
        />
    </View>
  );
}
