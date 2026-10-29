import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Minus } from "lucide-react";
import { DisplayMoney } from "@/components/CurrencyProvider";
import { getProductByHandle } from "@/lib/shopify/storefront";
import { getCustomizationConfig } from "@/lib/customization/configs";
import { includedBuildItems } from "@/lib/customization/chiku-preview";
import { protectedProductImageUrlFor } from "@/lib/catalog/productImage";
import { oralGuideExampleMatches, oralGuideExamples, oralGuideOptionPrice, oralGuideQuestions, oralGuideSources } from "@/lib/learn/oralGuide";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Oral Features Compared | DollWOW",
  description: "Compare oral suction, powered neck movement and manual ROS heads. Understand the differences before choosing your doll.",
  robots: { index: false, follow: false }
};

export default async function OralFeaturesReview() {
  if (process.env.VERCEL_ENV === "production" || process.env.DOL288_GUIDE_REDO !== "1") notFound();
  const examples = [];
  for (const example of oralGuideExamples) {
    const product = await getProductByHandle(example.handle, { cache: "no-store", strict: true });
    if (!product || !oralGuideExampleMatches(product, example) || !product.featuredImage) continue;
    const image = protectedProductImageUrlFor(product, product.featuredImage, "card");
    if (!image) continue;
    const config = getCustomizationConfig(product);
    const prices = example.options.flatMap(option => {
      const amount = oralGuideOptionPrice(product, config, example, option.groupId, option.optionId);
      return amount === null ? [] : [{ label: option.label, amount }];
    });
    if (prices.length !== example.options.length) continue;
    if (example.name === "Chiku" && !includedBuildItems(product).some(item => /fixed.*teeth.*tongue/i.test(item.label))) continue;
    examples.push({ example, product, image, prices });
  }

  return <article className={styles.guide}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>DollWOW Buying Guide</p>
      <h1>Oral features compared</h1>
      <p className={styles.lead}>A realistic mouth, powered suction and a head that moves are three different things. Choose the effect you want first, then match the right head and body.</p>
      <nav aria-label="Guide sections"><a href="#differences">The differences</a><a href="#brands">Brand details</a><a href="#dolls">Dolls to explore</a><a href="#questions">Common questions</a></nav>
    </header>

    <section id="differences" className={styles.section}>
      <h2>What actually moves?</h2>
      <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Oral feature comparison">
        <table><thead><tr><th scope="col">Feature</th><th scope="col">What it does</th><th scope="col">What it does not promise</th></tr></thead>
          <tbody>
            <tr><th scope="row">ROS / realistic oral structure</th><td>A shaped mouth and oral channel. Jaw, teeth and tongue details vary by head.</td><td>Automatic suction or powered head movement.</td></tr>
            <tr><th scope="row">Oral suction</th><td>A powered suction feature in a compatible head.</td><td>A head or neck that moves by itself.</td></tr>
            <tr><th scope="row">Powered tongue / auto licking</th><td>A motor moves or vibrates the tongue on a head fitted with that option.</td><td>Powered neck movement, or a feature included with every realistic tongue.</td></tr>
            <tr><th scope="row">Auto blowjob / powered neck movement</th><td>A motor moves the head through the neck mechanism.</td><td>Compatibility with every body, head or other motorized option.</td></tr>
            <tr><th scope="row">Oral heating</th><td>Warms the mouth on a compatible head.</td><td>Movement, suction or a moving tongue.</td></tr>
          </tbody></table>
      </div>
    </section>

    <section id="brands" className={styles.section}>
      <h2>Two features can share a name, not a mechanism</h2>
      <div className={styles.brandRow}><h3>Irontech</h3><div>
        <p>ROS MAX is a head design with an opening jaw. Irontech sells powered oral movement separately. A ROS MAX head alone does not make a doll motorized.</p>
        <p>For powered movement, confirm the exact body version: Irontech&apos;s movement instructions exclude certain silicone bodies. Do not assume a feature fits because it appears in a general options list.</p>
        <a href={oralGuideSources[0].href}>Irontech movement instructions <ArrowRight size={16} /></a>
      </div></div>
      <div className={styles.brandRow}><h3>SE Doll</h3><div>
        <p>SE&apos;s newer Blowjob Sexbot moves the head from a neck-mounted mechanism. Its separate silicone ROS-head system offers suction with sound, plus optional heating.</p>
        <p>The neck-movement guide names 148E, 150E, 158E, 163E and 168F TPE/STPE bodies. That guide says neck movement cannot be combined with waist-spin, and both exclude heating. These restrictions are not a blanket rule for the separate ROS-head suction system.</p>
        <a href={oralGuideSources[2].href}>SE movement and compatibility guide <ArrowRight size={16} /></a>
      </div></div>
      <div className={styles.brandRow}><h3>Top Fire</h3><div>
        <p>For mouth features together, Top Fire lists a three-in-one package: tongue movement, oral suction and oral heating. Its Auto Blowjob robot choices are listed separately, with plug-in and rechargeable versions.</p>
        <p>Choose by the movement you want, not by the word &ldquo;robot.&rdquo; The mouth package is not the same purchase as powered head movement, and a custom doll does not include either simply because they appear in the options.</p>
        <a href={oralGuideSources[4].href}>Compare Wendy&apos;s build options <ArrowRight size={16} /></a>
      </div></div>
      <div className={styles.brandRow}><h3>Angelkiss</h3><div>
        <p>Angelkiss offers oral suction and heating on selected ROS silicone heads. Its manufacturer announcement names S198, S266, S273, LS59 and LS60. A hard or standard head is not interchangeable with that feature choice.</p>
        <p>This route suits buyers who want mouth functions rather than powered neck movement. Choose the exact compatible head first; do not assume a feature shown on one face comes with every Angelkiss doll.</p>
        <a href={oralGuideSources[5].href}>Angelkiss ROS-head details <ArrowRight size={16} /></a>
      </div></div>
    </section>

    <section id="dolls" className={styles.section}>
      <h2>Explore the head features on real dolls</h2>
      <p>Base doll prices and separately listed add-ons are shown below. These are alternatives, not a bundle to add together. Select your complete build on the product page; shipping, taxes and any discounts are calculated separately.</p>
      <p>Prices checked {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })} (UTC).</p>
      <div className={styles.products}>{examples.map(({ example, product, image, prices }) => <article key={example.id} className={styles.product}>
        <a className={styles.photo} href={`https://dollwow.com/products/${example.handle}`} aria-label={`Explore ${example.name}`}>
          <Image src={image} alt={product.featuredImage!.altText ?? `${example.brand} ${example.name}`} fill sizes="(min-width: 900px) 30vw, (min-width: 600px) 45vw, 90vw" className={styles.photoImage} />
        </a>
        <div className={styles.productBody}>
          <p className={styles.eyebrow}>{example.brand} / {example.category}</p><h3>{example.name}</h3><p>{example.description}</p>
          <dl className={styles.prices}><div><dt>Base doll</dt><dd><DisplayMoney {...product.priceRange.minVariantPrice} /></dd></div>
            {prices.map(price => <div key={price.label}><dt>{price.label} add-on</dt><dd>+<DisplayMoney amount={String(price.amount)} currencyCode={product.priceRange.minVariantPrice.currencyCode} /></dd></div>)}
          </dl>
          <a className={styles.productLink} href={`https://dollwow.com/products/${example.handle}`}>Explore {example.name} <ArrowRight size={18} /></a>
        </div>
      </article>)}</div>
    </section>

    <section className={styles.section}>
      <h2>Before choosing a powered feature</h2>
      <ul className={styles.checks}>
        <li><Check size={20} /><span>Match the exact head, body model and body version.</span></li>
        <li><Check size={20} /><span>Check which features can be installed together.</span></li>
        <li><Check size={20} /><span>Confirm whether a warehouse listing includes a head and the installed functions you want.</span></li>
        <li><Minus size={20} /><span>Do not treat a fixed tongue, oral heating or vaginal suction as proof of powered oral movement.</span></li>
      </ul>
    </section>

    <section id="questions" className={styles.section}><h2>Common questions</h2>{oralGuideQuestions.map(item => <details key={item.question} className={styles.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
    <footer className={styles.sources}><h2>Manufacturer reading</h2><ul>{oralGuideSources.map(source => <li key={source.href}><a href={source.href}>{source.title}</a></li>)}</ul></footer>
  </article>;
}
