import { Redirect, router, Slot } from "expo-router";
import "react-native-get-random-values";
import { v4 } from "uuid";

export default function RedirectToUUID() {
  const newNoteUUID = v4();

  return <Redirect href={`/note/${newNoteUUID}`} />;
}
