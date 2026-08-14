import Image from "next/image";
import Link from "next/link";
import styles from "./FactoryApprovalPreview.module.css";

const archiveImages = [
  "/images/factory-approval-archive/factory-approval-001.webp",
  "/images/factory-approval-archive/factory-approval-002.webp",
  "/images/factory-approval-archive/factory-approval-003.webp",
  "/images/factory-approval-archive/factory-approval-004.webp",
  "/images/factory-approval-archive/factory-approval-005.webp",
  "/images/factory-approval-archive/factory-approval-006.webp",
  "/images/factory-approval-archive/factory-approval-007.webp",
  "/images/factory-approval-archive/factory-approval-008.webp"
] as const;

export function FactoryApprovalHomepagePreview() {
  return (
    <section className={styles.home} aria-labelledby="factory-approval-home-title">
      <div className={styles.homeInner}>
        <div className={styles.homeCopy}>
          <p className={styles.eyebrow}>Factory Approval Archive</p>
          <h2 id="factory-approval-home-title">A small selection from years of hands-on factory approval work.</h2>
          <p>
            These anonymized photographs offer a glimpse into the production media our team has reviewed while helping
            customers navigate custom doll orders. That experience now informs DollWOW’s Human Build Check and Approve
            Before Shipping process.
          </p>
          <div className={styles.homeActions}>
            <Link href="/factory-photos">Explore the Factory Approval Archive</Link>
            <Link href="/how-ordering-works">How approval works</Link>
          </div>
          <small>{archiveDisclosure}</small>
        </div>
        <div className={styles.homeMosaic} aria-label="Selected anonymized factory approval examples">
          {archiveImages.map((src, index) => (
            <figure key={src} className={index === 0 || index === 5 ? styles.largeTile : undefined}>
              <Image src={src} alt="Anonymized factory approval archive example" fill sizes="(max-width: 760px) 33vw, 190px" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FactoryApprovalPdpPreview() {
  return (
    <aside className={styles.pdp} aria-labelledby="factory-approval-pdp-title">
      <div className={styles.pdpImages} aria-hidden="true">
        {archiveImages.slice(0, 4).map((src) => (
          <span key={src}><Image src={src} alt="" fill sizes="80px" /></span>
        ))}
      </div>
      <div className={styles.pdpCopy}>
        <p className={styles.eyebrow}>Experience behind every review</p>
        <h2 id="factory-approval-pdp-title">Experienced eyes on your custom build</h2>
        <p>Our team brings years of hands-on custom-order and factory-approval experience to DollWOW.</p>
        <Link href="/factory-photos">See anonymized approval examples <span aria-hidden="true">→</span></Link>
        <small>Historical examples may show different products, options, manufacturers, and production processes.</small>
      </div>
    </aside>
  );
}

export function FactoryApprovalCartPreview() {
  return (
    <aside className={styles.cart} aria-label="Approve Before Shipping reassurance">
      <span className={styles.cartFilmstrip} aria-hidden="true">
        {archiveImages.slice(4, 7).map((src) => (
          <i key={src}><Image src={src} alt="" fill sizes="38px" /></i>
        ))}
      </span>
      <span className={styles.cartCopy}>
        <em>Approve Before Shipping</em>
        <strong>Factory-photo approval for eligible custom builds</strong>
        <small>Human review before your order is released</small>
      </span>
    </aside>
  );
}

export const archiveDisclosure =
  "Selected anonymized examples from real customer orders handled through our team's prior business experience before DollWOW launched. They are not current DollWOW orders or exact product examples.";
