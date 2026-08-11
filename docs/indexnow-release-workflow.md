# DollWow IndexNow Release Workflow

Use IndexNow only for DollWow URLs that were added, materially updated, redirected, or deleted in the current release. The XML sitemap remains the complete discovery source.

## First deployment

The repository hosts the IndexNow verification key at:

`https://dollwow.com/d4d5fc24-2236-4ad3-be46-f806a537ff83.txt`

Do not execute submissions until that URL returns the same key as plain text.

## Dry run

```bash
npm run seo:indexnow -- --urls '/learn/sex-doll-guide,/shop/sex-dolls'
```

## Submit a release batch

```bash
npm run seo:indexnow -- --execute --file changed-urls.txt
```

The file accepts one absolute DollWow URL or path per line. The script rejects external hosts, removes duplicates and fragments, verifies the live key file, and then submits the changed URLs to the shared IndexNow endpoint.

## Operating rules

- Submit changed canonical URLs, not every sitemap URL on every release.
- Include an old URL when it was deleted or redirected so participating search engines can refresh it.
- Keep the XML sitemap limited to live canonical URLs.
- Record each release batch in the SEO implementation log.
- Review Bing Webmaster Tools IndexNow reporting after the first successful submission.
