import { Switch, Text, View } from "react-native";

type ToggleProps = {
  label: string;
  enabled?: boolean;
  onChange?: (value: boolean) => void;
};

export default function Toggle({ label, enabled = false, onChange }: ToggleProps) {
  const trimmed = label.trim();
  return (
    <View className="flex-row items-center justify-between gap-3">
      {trimmed.length > 0 ? (
        <Text
          className="flex-1 text-base text-slate-700 dark:text-slate-200"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      ) : null}
      <Switch
        value={enabled}
        onValueChange={onChange}
        trackColor={{ false: "#cbd5f5", true: "#4a9cff" }}
        thumbColor={enabled ? "#ffffff" : "#ffffff"}
      />
    </View>
  );
}
