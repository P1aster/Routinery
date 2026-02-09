import { formatVolume } from "./units";
import type { Units } from "./types";

export type HydrationPreset = {
  id: string;
  label: string;
  amountMl: number;
  icon: string;
};

export const HYDRATION_PRESETS: HydrationPreset[] = [
  { id: "sip", label: "Sip", amountMl: 150, icon: "🥤" },
  { id: "cup", label: "Cup", amountMl: 250, icon: "☕️" },
  { id: "bottle", label: "Bottle", amountMl: 500, icon: "🧴" },
  { id: "large-bottle", label: "Large bottle", amountMl: 750, icon: "🚰" }
];

export function getHydrationLabel(amount: number, units: Units = "ml"): string {
  const match = HYDRATION_PRESETS.find((preset) => preset.amountMl === amount);
  if (match) {
    return `${match.label} ${formatVolume(match.amountMl, units)}`;
  }
  return `${formatVolume(amount, units)} hydration`;
}
