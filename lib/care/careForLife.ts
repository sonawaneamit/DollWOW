export const CARE_FOR_LIFE_HREF = "/care-for-life";

export const careForLife = {
  name: "DollWOW Care for Life",
  promise:
    "Every DollWOW doll is reviewed before production, approved before shipping, documented for ownership, and supported for as long as you own it.",
  care365: {
    name: "DollWOW Care 365",
    seal: "CARE 365",
    ring: "INCLUDED WITH EVERY DOLLWOW DOLL",
    accessibleLabel: "DollWOW Care 365 is included with every DollWOW doll",
    summary: "One year of ownership support, plus an eligible accidental-damage rescue.",
    detailsLabel: "See Care 365 details"
  },
  commitments: [
    { name: "Human Build Check", summary: "A person reviews the selected build, compatibility, measurements, weight, and expected production path." },
    { name: "30-Day Price Lock", summary: "Eligible lower delivered prices from legitimate authorized sellers can be reviewed during the first 30 days." },
    { name: "Approve Before Shipping", summary: "Custom-order customers review factory photographs or video before release." },
    { name: "Arrival-Right Guarantee", summary: "Documented delivery damage, incorrect items, or a meaningful difference from the approved build receives a resolution assessment." },
    { name: "Free Basic Repair Kits for Life", summary: "The original purchaser can request an appropriate basic repair kit for a documented minor repair; shipping, taxes, and duties remain the customer’s responsibility." },
    { name: "Lifetime Repair Concierge", summary: "We continue helping with compatible parts, manufacturer guidance, and repair options after Care 365 ends." },
    { name: "Doll Passport", summary: "A private ownership record for the build, factory approval, documents, and support history." }
  ],
  gates: {
    collectorCreditPublic: false,
    careFinancialLimitsPublic: false,
    passportGeneralAvailabilityPublic: false
  }
} as const;
