// Turns a psacc timestamp ("2026-10-07 15:29:28+00:00") into a short "x min
// ago" label. psacc uses a space between date and time; normalise it to ISO so
// the browser parses it. Returns null for a missing or unparseable value.
const relativeTime = (value: string | null): string | null => {
  if (!value) return null;
  const ms = new Date(value.replace(" ", "T")).getTime();
  if (Number.isNaN(ms)) return null;

  const seconds = Math.round((Date.now() - ms) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${String(minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${String(hours)} h ago`;
  const days = Math.round(hours / 24);
  return `${String(days)} d ago`;
};

export { relativeTime };
