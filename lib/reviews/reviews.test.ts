import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { getCustomerReviews, getHomepageReviews, getReviewSummary } from "@/lib/reviews/reviews";

describe("first-party review dataset", () => {
  it("contains every unique sheet review and the expected rating totals", () => {
    const reviews = getCustomerReviews();
    const summary = getReviewSummary(reviews);

    expect(reviews).toHaveLength(280);
    expect(new Set(reviews.map((review) => review.id)).size).toBe(280);
    expect(reviews.map((review) => review.id)).toEqual(Array.from({ length: 280 }, (_, index) => index + 1));
    expect(summary.distribution).toEqual([
      { stars: 5, count: 240 },
      { stars: 4, count: 32 },
      { stars: 3, count: 8 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 }
    ]);
    expect(summary.withPhotos).toBe(53);
    for (const review of reviews.filter((review) => review.photo)) {
      expect(existsSync(path.join(process.cwd(), "public", review.photo!))).toBe(true);
    }
  });

  it("uses five source reviews on the homepage with exactly one four-star quote", () => {
    const reviews = getHomepageReviews();

    expect(reviews.map((review) => review.id)).toEqual([37, 26, 52, 12, 16]);
    expect(reviews).toHaveLength(5);
    expect(reviews.every((review) => review.photo)).toBe(true);
    expect(reviews.filter((review) => review.stars === 4)).toHaveLength(1);
    expect(reviews.filter((review) => review.stars === 5)).toHaveLength(4);
  });
});
