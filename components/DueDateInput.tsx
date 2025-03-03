import { AntDesign } from '@expo/vector-icons';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Button } from 'react-native-paper';
import {
  DatePickerInput,
  DatePickerModal,
  TimePickerModal,
} from 'react-native-paper-dates';

export default function DueDateInput({ date, setDate }) {
  const [visible, setVisible] = useState(false);
  const [visibleDate, setVisibleDate] = useState(false);
  const [inputHours, setInputHours] = useState<number | undefined>();
  const [inputMinutes, setInputMinutes] = useState<number | undefined>();

  useEffect(() => {
    if (!date) {
      setInputHours(undefined);
      setInputMinutes(undefined);
    } else {
      setInputMinutes(moment(date).minutes());
      setInputHours(moment(date).hours());
    }
  }, [date]);

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const onConfirm = useCallback(
    ({ hours, minutes }) => {
      setInputHours(hours);
      setInputMinutes(minutes);
      setDate(moment(date).hours(hours).minutes(minutes).toISOString());
      setVisible(false);
    },
    [setVisible, date, setDate],
  );

  const onDateConfirm = useCallback(
    (params: { date: Date }) => {
      setInputHours(0);
      setInputMinutes(0);
      setDate(moment(params.date).hours(0).minutes(0).toISOString());
      setVisibleDate(false);
    },
    [setVisibleDate, setDate, setInputHours, setInputMinutes],
  );

  return (
    <View className="flex flex-col gap-4 py-8">
      <Text className="text-text">Due date</Text>
      <Pressable onPress={() => setVisibleDate(true)}>
        <View className="flex flex-row justify-between p-4 bg-secondary-850 rounded-xl">
          {date ? (
            <Text className="text-text grow">
              {moment(date).format('DD.MM.YYYY')}
            </Text>
          ) : (
            <Text className="text-text grow">Press to select date </Text>
          )}
          <Text className="text-text">
            <AntDesign name="calendar" size={24} />
          </Text>
        </View>
      </Pressable>

      <Text className="text-text">Due time</Text>
      <Pressable onPress={() => setVisible(true)}>
        <View className="flex flex-row justify-between p-4 bg-secondary-850 rounded-xl">
          {typeof inputHours !== 'undefined' ||
          typeof inputMinutes !== 'undefined' ? (
            <Text className="text-text grow">
              {String(inputHours)?.length === 1 ? '0' + inputHours : inputHours}
              :
              {String(inputMinutes)?.length === 1
                ? '0' + inputMinutes
                : inputMinutes}
            </Text>
          ) : (
            <Text className="text-text grow">Press to select time </Text>
          )}
          <Text className="text-text">
            <AntDesign name="clockcircleo" size={24} />
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => setDate('')}
        className="bg-accent p-2 rounded-xl"
      >
        <Text className="text-center text-background">Clear due date</Text>
      </Pressable>
      <TimePickerModal
        visible={visible}
        onDismiss={onDismiss}
        onConfirm={onConfirm}
        label="Time"
        use24HourClock
      />
      <DatePickerModal
        visible={visibleDate}
        mode="single"
        date={date ? new Date(date) : undefined}
        validRange={{
          startDate: new Date(moment().subtract(1, 'days').format()),
        }}
        onDismiss={() => setVisibleDate(false)}
        onConfirm={onDateConfirm}
      />
    </View>
  );
}
