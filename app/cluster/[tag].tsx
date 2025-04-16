import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import NotesSlider from '~/components/NotesSlider';
import { TaskBoardParent } from '~/components/tasks/TaskBoardParent';
import { useNoteStore } from '~/utils/manageNotes';
import { useTaskBoardStore } from '~/utils/manageTaskBoards';
import { TaskBoardContentWeb } from '../taskboard/[uuid].web';
import { Hr } from '~/components/WebTabLayout';

export default function TagCluster() {
  const { tag } = useLocalSearchParams();
  const { notesWithTag } = useNoteStore();
  const { taskBoardsWithTag } = useTaskBoardStore();

  if (!tag) return <Redirect href="/" />;

  const notes = notesWithTag(tag as string);
  const taskBoards = taskBoardsWithTag(tag as string);

  return (
    <ScrollView>
      <Text className="pb-8 text-3xl text-text">
        <Text className="font-extrabold capitalize text-text">{tag}</Text> Cluser
      </Text>

      <Text className="text-xl text-text pb-4">Notes</Text>
      {notes.length > 0 && (
        <View className="flex flex-col gap-2">
          <NotesSlider notes={notes} />
        </View>
      )}

      <Text className="text-xl text-text py-4">Task Boards</Text>

      {taskBoards.length > 0 &&
        taskBoards.map((taskBoard) => (
          <>
            <Hr />
            <TaskBoardParent propUuid={taskBoard.uuid} TaskBoardContent={TaskBoardContentWeb} />
          </>
        ))}
    </ScrollView>
  );
}
