export type TimeParts = { hour: number; minute: number };

export function parseTime(value: string): TimeParts | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return { hour, minute };
}

export function isValidTime(value: string): boolean {
  return parseTime(value) !== null;
}

export function toMinutes(value: string): number | null {
  const parsed = parseTime(value);
  if (!parsed) {
    return null;
  }
  return parsed.hour * 60 + parsed.minute;
}

export function normalizeTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  const hours = digits.slice(0, 2);
  const minutes = digits.slice(2, 4);
  return `${hours}:${minutes}`;
}
