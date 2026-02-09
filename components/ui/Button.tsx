import { Pressable, Text } from "react-native";

type ButtonProps = {
  label: string;
  variant?: "primary" | "secondary";
  onPress?: () => void;
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  variant = "primary",
  onPress,
  disabled = false
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const displayLabel = label.trim().length > 0 ? label : "Add";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={[
        "flex-1 items-center justify-center rounded-full px-5 py-3.5",
        isPrimary
          ? "bg-brand-600 shadow-xl shadow-brand-600/25"
          : "bg-slate-100/80 ring-1 ring-inset ring-slate-200/80 dark:bg-slate-900/70 dark:ring-slate-800",
        disabled ? "opacity-60" : "opacity-100"
      ].join(" ")}
    >
      <Text
        className={[
          "text-base font-semibold",
          isPrimary ? "text-white" : "text-slate-700 dark:text-slate-200"
        ].join(" ")}
      >
        {displayLabel}
      </Text>
    </Pressable>
  );
}
