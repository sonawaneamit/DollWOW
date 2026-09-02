import reviewData from "@/data/reviews/customer-reviews.json";

export type CustomerReview = {
  id: number;
  date: string;
  reviewerName: string;
  stars: number;
  title: string;
  text: string;
  photo?: string;
};

const PHOTO_REVIEW_IDS = new Set(Array.from({ length: 53 }, (_, index) => index + 1));
const HOMEPAGE_REVIEW_IDS = [37, 26, 52, 110, 16] as const;

const reviews = reviewData.reviews.map((review) => ({
  ...review,
  photo: PHOTO_REVIEW_IDS.has(review.id)
    ? `/images/reviews/customer/doll-wow-customer-photos${review.id}.jpg`
    : undefined
})) satisfies CustomerReview[];

export const reviewSource = reviewData.source;

export function getCustomerReviews() {
  return reviews;
}

export function getHomepageReviews() {
  return HOMEPAGE_REVIEW_IDS.map((id) => {
    const review = reviews.find((entry) => entry.id === id);
    if (!review) throw new Error(`Homepage review ${id} is missing from the source dataset.`);
    return review;
  });
}

export function getReviewSummary(reviewList: CustomerReview[] = reviews) {
  const totalStars = reviewList.reduce((sum, review) => sum + review.stars, 0);
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviewList.filter((review) => review.stars === stars).length
  }));

  return {
    average: reviewList.length ? totalStars / reviewList.length : 0,
    count: reviewList.length,
    withPhotos: reviewList.filter((review) => review.photo).length,
    distribution
  };
}
