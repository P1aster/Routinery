import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";

import { parseTime } from "../../lib/time";

type TimePickerInputProps = {
  label?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function toDate(value: string): Date {
  const now = new Date();
  const parsed = parseTime(value);
  if (!parsed) {
    return now;
  }

  const next = new Date(now);
  next.setHours(parsed.hour, parsed.minute, 0, 0);
  return next;
}

export default function TimePickerInput({
  label,
  value,
  placeholder,
  disabled = false,
  onChange
}: TimePickerInputProps) {
  const [open, setOpen] = useState(false);
  const initialValue = useMemo(() => toDate(value), [value]);
  const [draftValue, setDraftValue] = useState<Date>(initialValue);

  useEffect(() => {
    setDraftValue(initialValue);
  }, [initialValue]);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setOpen(false);
      return;
    }

    if (!selectedDate) {
      return;
    }

    if (Platform.OS === "android") {
      setOpen(false);
      onChange(formatTime(selectedDate));
      return;
    }

    setDraftValue(selectedDate);
  };

  const confirmIOS = () => {
    onChange(formatTime(draftValue));
    setOpen(false);
  };

  const displayValue = value.length > 0 ? value : placeholder ?? "--:--";

  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        className={[
          "rounded-2xl bg-white/80 px-4 py-3",
          disabled ? "opacity-60" : "opacity-100",
          "dark:bg-slate-900/60"
        ].join(" ")}
      >
        <Text className="text-base text-slate-700 dark:text-slate-200">{displayValue}</Text>
      </Pressable>

      {Platform.OS === "android" && open ? (
        <DateTimePicker
          value={draftValue}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal
          visible={open}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <Pressable
            className="flex-1 items-end justify-end bg-slate-950/40"
            onPress={() => setOpen(false)}
          >
          <Pressable
            className="w-full rounded-t-3xl bg-[#f6f1ea] px-6 pb-8 pt-4 dark:bg-slate-950"
            onPress={(event) => event.stopPropagation()}
          >
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-900 dark:text-white">
                  {label ?? "Select time"}
                </Text>
                <Pressable
                  onPress={confirmIOS}
                  className="rounded-full bg-slate-900 px-4 py-2 dark:bg-white"
                >
                  <Text className="text-xs font-semibold uppercase tracking-wide text-white dark:text-slate-900">
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={draftValue}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleChange}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
