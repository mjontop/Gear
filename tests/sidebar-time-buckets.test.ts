import { describe, it, expect } from "vitest";
import {
  getTimeBucketLabel,
  groupByTimeBuckets,
} from "@/components/sidebar/utils/time-buckets";

describe("sidebar time-buckets utility", () => {
  const baseTime = new Date(2026, 9, 7, 15, 0, 0).getTime();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;

  describe("getTimeBucketLabel", () => {
    it("returns 'Today' for timestamps within the current day", () => {
      expect(getTimeBucketLabel(baseTime - 2 * oneHour, baseTime)).toBe(
        "Today",
      );
    });

    it("returns 'Yesterday' for timestamps within the previous day", () => {
      expect(getTimeBucketLabel(baseTime - 1.2 * oneDay, baseTime)).toBe(
        "Yesterday",
      );
    });

    it("returns '2 days ago' for timestamps 2 days prior", () => {
      expect(getTimeBucketLabel(baseTime - 2.2 * oneDay, baseTime)).toBe(
        "2 days ago",
      );
    });

    it("returns '5 days ago' for timestamps between 3 and 6 days prior", () => {
      expect(getTimeBucketLabel(baseTime - 4.5 * oneDay, baseTime)).toBe(
        "5 days ago",
      );
    });

    it("returns '1 week ago' for timestamps around 7 to 13 days prior", () => {
      expect(getTimeBucketLabel(baseTime - 9 * oneDay, baseTime)).toBe(
        "1 week ago",
      );
    });

    it("returns '1 month ago' for timestamps around 14 to 30 days prior", () => {
      expect(getTimeBucketLabel(baseTime - 20 * oneDay, baseTime)).toBe(
        "1 month ago",
      );
    });

    it("returns 'Older' for timestamps older than 30 days", () => {
      expect(getTimeBucketLabel(baseTime - 45 * oneDay, baseTime)).toBe(
        "Older",
      );
    });
  });

  describe("groupByTimeBuckets", () => {
    it("groups items into chronological buckets in correct order", () => {
      const items = [
        { id: 1, title: "Older item", time: baseTime - 40 * oneDay },
        { id: 2, title: "Today item", time: baseTime - oneHour },
        { id: 3, title: "Yesterday item", time: baseTime - 1.2 * oneDay },
      ];

      const groups = groupByTimeBuckets(items, (i) => i.time, baseTime);

      expect(groups).toHaveLength(3);
      expect(groups[0].label).toBe("Today");
      expect(groups[0].items).toHaveLength(1);
      expect(groups[0].items[0].id).toBe(2);

      expect(groups[1].label).toBe("Yesterday");
      expect(groups[1].items).toHaveLength(1);
      expect(groups[1].items[0].id).toBe(3);

      expect(groups[2].label).toBe("Older");
      expect(groups[2].items).toHaveLength(1);
      expect(groups[2].items[0].id).toBe(1);
    });

    it("returns empty array when item list is empty", () => {
      const groups = groupByTimeBuckets([], (i: any) => i.time, baseTime);
      expect(groups).toEqual([]);
    });
  });
});
