import { AntDesign } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "react-native-paper";
import {
  DatePickerInput,
  DatePickerModal,
  TimePickerModal,
} from "react-native-paper-dates";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
};

export default function DueDateInput({ date, setDate }) {
  const [visible, setVisible] = useState(false);
  const [visibleDate, setVisibleDate] = useState(false);
  const [inputDate, setInputDate] = useState(date ? new Date(date) : undefined);
  const [inputHours, setInputHours] = useState(
    date ? new Date(date).getHours() : undefined,
  );
  const [inputMinutes, setInputMinutes] = useState(
    date ? new Date(date).getMinutes() : undefined,
  );

  useEffect(() => {
    if (!date) return;
    setInputMinutes(new Date(date).getMinutes());
    setInputHours(new Date(date).getHours());
    const dateObj = new Date(date);
    const dateWithTime = new Date(dateObj.setHours(0, 0, 0, 0));
    setInputDate(dateWithTime);
  }, [date]);

  useEffect(() => {
    if (
      typeof inputDate === "undefined" ||
      typeof inputHours === "undefined" ||
      typeof inputMinutes === "undefined"
    )
      return;
    const dateObj = new Date(inputDate);
    const dateWithTime = new Date(dateObj.setHours(inputHours, inputMinutes));
    setDate(dateWithTime.toISOString());
  }, [inputDate, inputHours, inputMinutes]);

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  const onConfirm = useCallback(
    ({ hours, minutes }) => {
      setInputHours(hours);
      setInputMinutes(minutes);
      if (!inputDate) setInputDate(new Date());
      setVisible(false);
    },
    [setVisible],
  );

  const onDateConfirm = useCallback(
    (date) => {
      setInputDate(date);
      if (!minutes || !hours) {
        setInputHours(0);
        setInputMinutes(0);
      }
      setVisibleDate(false);
    },
    [setVisibleDate],
  );

  return (
    <View className="flex flex-col gap-4 py-8">
      <Text className="text-text">Due date</Text>
      <Pressable onPress={() => setVisibleDate(true)}>
        <View className="flex flex-row justify-between p-4 bg-secondary-850 rounded">
          {!isNaN(inputHours) || !isNaN(inputMinutes) ? (
            <Text className="text-text grow">{formatDate(inputDate)}</Text>
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
        <View className="flex flex-row justify-between p-4 bg-secondary-850 rounded">
          {!isNaN(inputHours) || !isNaN(inputMinutes) ? (
            <Text className="text-text grow">
              {String(inputHours)?.length === 1 ? "0" + inputHours : inputHours}
              :
              {String(inputMinutes)?.length === 1
                ? "0" + inputMinutes
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
        date={inputDate}
        onDismiss={() => setVisibleDate(false)}
        onConfirm={onDateConfirm}
      />
    </View>
  );
}
