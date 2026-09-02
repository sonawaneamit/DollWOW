import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StarRating } from "@/components/reviews/StarRating";
import type { CustomerReview } from "@/lib/reviews/reviews";

export function HomepageReviews({ reviews }: { reviews: CustomerReview[] }) {
  return (
    <section className="home-reviews" aria-labelledby="home-reviews-title">
      <div className="home-band__inner">
        <div className="home-reviews__head reveal">
          <div>
            <p className="home-eyebrow">Customer reviews</p>
            <h2 id="home-reviews-title">Real notes from DollWow customers</h2>
            <p>Unedited feedback about delivery, support, product accuracy, and the buying process.</p>
          </div>
          <Link className="home-btn home-btn--ghost" href="/reviews">
            Read all reviews <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="home-reviews__rail reveal" data-d="2">
          {reviews.map((review) => {
            if (!review.photo) {
              throw new Error(`Homepage review ${review.id} must include its matching customer photo.`);
            }

            return (
              <article className="home-review-card" key={review.id}>
                <Link className="home-review-card__photo" href={`/reviews#review-${review.id}`} aria-label={`Read ${review.reviewerName}'s review`}>
                  <Image
                    src={review.photo}
                    alt={`Watermarked customer photo submitted with ${review.reviewerName}'s DollWow review`}
                    fill
                    sizes="(min-width: 640px) 255px, 82vw"
                  />
                </Link>
                <div className="home-review-card__content">
                  <StarRating rating={review.stars} size="sm" />
                  <h3>{review.title}</h3>
                  <blockquote>“{review.text}”</blockquote>
                  <footer>
                    <strong>{review.reviewerName}</strong>
                    <span>{formatReviewDate(review.date)}</span>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function formatReviewDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`));
}
