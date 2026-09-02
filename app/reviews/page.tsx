import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera, CheckCircle2, MessageSquareQuote } from "lucide-react";
import { StarRating } from "@/components/reviews/StarRating";
import { getCustomerReviews, getReviewSummary } from "@/lib/reviews/reviews";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dollwow.com").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Customer Reviews",
  description: "Read first-party feedback from DollWow customers about delivery, support, product accuracy, and the ordering experience.",
  alternates: {
    canonical: `${siteUrl}/reviews`,
    types: { "text/markdown": `${siteUrl}/markdown/reviews` }
  }
};

export default function ReviewsPage() {
  const reviews = [...getCustomerReviews()].sort((left, right) =>
    right.date.localeCompare(left.date) || right.id - left.id
  );
  const summary = getReviewSummary(reviews);

  return (
    <div className="reviews-page">
      <header className="reviews-hero">
        <div className="reviews-shell reviews-hero__inner">
          <p className="reviews-eyebrow">DollWow customer reviews</p>
          <h1>What customers say after ordering</h1>
          <p className="reviews-hero__lead">
            All {summary.count} customer reviews in our current first-party review record, shown in full with customer photos where provided.
          </p>
          <div className="reviews-hero__trust">
            <span><CheckCircle2 aria-hidden="true" /> First-party feedback</span>
            <span><Camera aria-hidden="true" /> {summary.withPhotos} customer photos</span>
          </div>
        </div>
      </header>

      <section className="reviews-shell reviews-widget" aria-labelledby="reviews-list-title">
        <aside className="reviews-summary" aria-label="Review summary">
          <div className="reviews-summary__score">
            <strong>{summary.average.toFixed(1)}</strong>
            <div>
              <StarRating rating={summary.average} size="lg" label={`${summary.average.toFixed(1)} out of 5 stars`} />
              <span>Based on {summary.count} reviews</span>
            </div>
          </div>

          <div className="reviews-summary__bars">
            {summary.distribution.map((entry) => (
              <div className="reviews-summary__bar" key={entry.stars}>
                <span>{entry.stars} star</span>
                <span className="reviews-summary__track" aria-hidden="true">
                  <span style={{ width: `${(entry.count / summary.count) * 100}%` }} />
                </span>
                <strong>{entry.count}</strong>
              </div>
            ))}
          </div>

          <p className="reviews-summary__note">
            Reviews appear as submitted. Photos are customer-provided and carry the DollWow watermark.
          </p>
        </aside>

        <div className="reviews-list">
          <div className="reviews-list__head">
            <div>
              <p className="reviews-eyebrow">All feedback</p>
              <h2 id="reviews-list-title">{summary.count} reviews</h2>
            </div>
            <span><MessageSquareQuote aria-hidden="true" /> Newest first</span>
          </div>

          {reviews.map((review) => (
            <article className={`review-row ${review.photo ? "review-row--with-photo" : ""}`} id={`review-${review.id}`} key={review.id}>
              <div className="review-row__body">
                <div className="review-row__meta">
                  <StarRating rating={review.stars} size="sm" />
                  <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
                </div>
                <h3>{review.title}</h3>
                <p>{review.text}</p>
                <div className="review-row__reviewer">
                  <span aria-hidden="true">{review.reviewerName.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{review.reviewerName}</strong>
                    <small><CheckCircle2 aria-hidden="true" /> DollWow customer</small>
                  </div>
                </div>
              </div>

              {review.photo ? (
                <Link className="review-row__photo" href={review.photo} target="_blank" aria-label={`Open customer photo for review by ${review.reviewerName}`}>
                  <Image
                    src={review.photo}
                    alt={`Watermarked customer photo submitted with ${review.reviewerName}'s DollWow review`}
                    fill
                    sizes="(min-width: 900px) 230px, 100vw"
                  />
                  <span><Camera aria-hidden="true" /> Customer photo</span>
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatReviewDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`));
}
