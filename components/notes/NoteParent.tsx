import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import 'react-native-get-random-values';
import { parse, v4 } from 'uuid';

export type NotePageProps = {
  uuid: string;
};
export type NotePage = React.FC<NotePageProps>;
type NoteParentProps = {
  NotePageContent: NotePage;
};

export const NoteParent = ({ NotePageContent }: NoteParentProps) => {
  const { uuid } = useLocalSearchParams();
  const [isInvalidUUID, setIsInvalidUUID] = useState(false);

  useEffect(() => {
    try {
      parse(uuid as string);
      setIsInvalidUUID(false);
    } catch (error) {
      setIsInvalidUUID(true);
    }
  }, [uuid]);

  if (isInvalidUUID) return <Redirect href={`/note/${v4()}`} />;

  return <NotePageContent uuid={uuid as string} />;
};
