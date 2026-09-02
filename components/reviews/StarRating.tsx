type StarRatingProps = {
  rating: number;
  label?: string;
  size?: "sm" | "md" | "lg";
};

export function StarRating({ rating, label, size = "md" }: StarRatingProps) {
  const roundedRating = Math.round(rating);
  const accessibleLabel = label ?? `${rating} out of 5 stars`;

  return (
    <span className={`review-stars review-stars--${size}`} role="img" aria-label={accessibleLabel}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < roundedRating ? "is-filled" : ""} aria-hidden="true">★</span>
      ))}
    </span>
  );
}
