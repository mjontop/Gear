export type TimeBucketGroup<T> = {
  label: string;
  items: T[];
};

export function getTimeBucketLabel(
  timestamp: number,
  now: number = Date.now(),
): string {
  const nowDate = new Date(now);
  const targetDate = new Date(timestamp);

  const startOfToday = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate(),
  ).getTime();

  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOf2DaysAgo = startOfToday - 2 * 24 * 60 * 60 * 1000;
  const startOf5DaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const startOf1WeekAgo = startOfToday - 13 * 24 * 60 * 60 * 1000;
  const startOf1MonthAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

  const targetTime = targetDate.getTime();

  if (targetTime >= startOfToday) {
    return "Today";
  }
  if (targetTime >= startOfYesterday) {
    return "Yesterday";
  }
  if (targetTime >= startOf2DaysAgo) {
    return "2 days ago";
  }
  if (targetTime >= startOf5DaysAgo) {
    return "5 days ago";
  }
  if (targetTime >= startOf1WeekAgo) {
    return "1 week ago";
  }
  if (targetTime >= startOf1MonthAgo) {
    return "1 month ago";
  }
  return "Older";
}

const BUCKET_ORDER = [
  "Today",
  "Yesterday",
  "2 days ago",
  "5 days ago",
  "1 week ago",
  "1 month ago",
  "Older",
];

export function groupByTimeBuckets<T>(
  items: T[],
  getTimestamp: (item: T) => number,
  now: number = Date.now(),
): TimeBucketGroup<T>[] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const timestamp = getTimestamp(item);
    const label = getTimeBucketLabel(timestamp, now);
    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(item);
  }

  const result: TimeBucketGroup<T>[] = [];
  for (const label of BUCKET_ORDER) {
    const bucketItems = groups.get(label);
    if (bucketItems && bucketItems.length > 0) {
      result.push({
        label,
        items: bucketItems,
      });
    }
  }

  return result;
}
