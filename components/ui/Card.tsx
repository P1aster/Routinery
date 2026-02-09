import { ReactNode } from "react";
import { View } from "react-native";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <View
      className={[
        "rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/40",
        "dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-950/50",
        className
      ].join(" ")}
    >
      {children}
    </View>
  );
}
