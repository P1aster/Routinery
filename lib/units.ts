import type { Units } from "./types";

const ML_PER_OZ = 29.5735;

export function formatVolume(valueMl: number, units: Units): string {
  if (units === "oz") {
    const ounces = valueMl / ML_PER_OZ;
    return `${Math.round(ounces)}oz`;
  }

  if (valueMl >= 1000) {
    return `${(valueMl / 1000).toFixed(1)}L`;
  }

  return `${Math.round(valueMl)}ml`;
}

export function formatDailyHydration(valueMl: number, units: Units): string {
  if (units === "oz") {
    const ounces = valueMl / ML_PER_OZ;
    return `${Math.round(ounces)}oz avg/day`;
  }

  return `${Math.round(valueMl)}ml avg/day`;
}
