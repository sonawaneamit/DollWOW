#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

export function validateRecord(record) {
  for (const key of ['calendarId', 'slug', 'title', 'body', 'description']) {
    if (typeof record[key] !== 'string' || !record[key].trim()) throw new Error(`Missing ${key}`);
  }
  if (!/^NEW-\d{2}$/.test(record.calendarId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) throw new Error('Invalid calendar ID or slug');
  const html = parse(record.body);
  if (html.querySelector('h1,script,iframe,style,form,input,object,embed')) throw new Error('Disallowed article markup');
  for (const element of html.querySelectorAll('*')) {
    for (const [key, value] of Object.entries(element.attributes)) {
      if (/^on/i.test(key) || key === 'style') throw new Error('Unsafe or competing presentation attribute');
      if (['src', 'href'].includes(key)) {
        const url = new URL(value);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Non-HTTPS article resource');
        if (key === 'src' && !['dollwow.com', 'cdn.shopify.com'].includes(url.hostname)) throw new Error('External image hotlink');
      }
    }
  }
  if (html.text.trim().split(/\s+/).length < 400) throw new Error('Article is not a full text draft');
  if (/mail\.google\.com|drive\.google\.com|gmail message|sourceUrl|scrapedAt|EXW|COGS|\/Volumes\//i.test(record.body)) throw new Error('Private source material in article');
  return record;
}

export function buildArticleInput(record, blogId) {
  validateRecord(record);
  return {
    blogId,
    title: record.title,
    handle: record.slug,
    body: record.body,
    summary: record.summary || record.description,
    author: { name: 'DollWOW Editorial' },
    isPublished: false,
    tags: [record.category, record.primaryKeyword].filter(Boolean),
    metafields: [
      { namespace: 'global', key: 'title_tag', type: 'single_line_text_field', value: record.title },
      { namespace: 'global', key: 'description_tag', type: 'single_line_text_field', value: record.description }
    ]
  };
}

export function assertDraft(article, expected) {
  if (!article || article.isPublished !== false || article.publishedAt !== null) throw new Error('Shopify article is not an unscheduled draft');
  for (const key of ['handle', 'title', 'body']) {
    const value = key === 'handle' ? expected.slug : expected[key];
    const actualValue = key === 'body' ? canonicalHtml(article[key]) : article[key];
    const expectedValue = key === 'body' ? canonicalHtml(value) : value;
    if (actualValue !== expectedValue) throw new Error(`Shopify readback mismatch: ${key}`);
  }
}

export function assertOwnedReconciliation(article, receipt) {
  const hash = createHash('sha256').update(article.body).digest('hex');
  if (!receipt || receipt.error || receipt.articleId !== article.id || receipt.slug !== article.handle || receipt.title !== article.title || receipt.sha256 !== hash || article.isPublished !== false || article.publishedAt !== null) throw new Error('Refusing to overwrite an unowned or modified article');
}

function canonicalHtml(html) {
  // Shopify decodes entities and reformats HTML; compare content, structure and attributes.
  const visit = node => {
    if (node.nodeType === 3) return node.text.replace(/\s+/g, ' ').trim() || null;
    if (node.nodeType !== 1) return null;
    const attributes = Object.entries(node.attributes || {}).sort(([a], [b]) => a.localeCompare(b));
    return [node.rawTagName || 'root', attributes, node.childNodes.map(visit).filter(v => v !== null)];
  };
  return JSON.stringify(visit(parse(html)));
}

async function main() {
  const args = process.argv.slice(2);
  const get = name => args[args.indexOf(name) + 1];
  if (!args.includes('--input') || !args.includes('--output')) throw new Error('--input and --output are required');
  const records = JSON.parse(await fs.readFile(get('--input'), 'utf8'));
  if (!Array.isArray(records) || !records.length) throw new Error('No article records');
  records.forEach(validateRecord);
  if (new Set(records.map(r => r.slug)).size !== records.length || new Set(records.map(r => r.calendarId)).size !== records.length) throw new Error('Duplicate input articles');
  const execute = args.includes('--execute');
  const out = path.resolve(get('--output'));
  const prior = args.includes('--reconcile-from') ? JSON.parse(await fs.readFile(get('--reconcile-from'), 'utf8')).records : [];
  await fs.mkdir(path.dirname(out), { recursive: true });
  const report = { startedAt: new Date().toISOString(), execute, requested: records.length, records: [], published: 0 };
  if (!execute) {
    report.validated = records.map(r => ({ calendarId: r.calendarId, slug: r.slug, title: r.title, isPublished: false }));
    await fs.writeFile(out, JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ dryRun: true, validated: records.length, output: out }));
    return;
  }
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!domain || !/^[a-z0-9-]+\.myshopify\.com$/.test(domain)) throw new Error('Invalid Shopify domain');
  let token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  if (!token) {
    const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID || '', client_secret: process.env.SHOPIFY_CLIENT_SECRET || '' }),
      signal: AbortSignal.timeout(30000)
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) throw new Error('Shopify authentication failed');
    token = data.access_token;
  }
  const api = async (query, variables = {}) => {
    const response = await fetch(`https://${domain}/admin/api/2026-04/graphql.json`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(45000)
    });
    const data = await response.json();
    if (!response.ok || data.errors?.length) throw new Error(JSON.stringify(data.errors || { status: response.status }));
    return data.data;
  };
  const data = await api('query { blogs(first:100) { nodes { id title handle } } }');
  const blog = data.blogs.nodes.find(b => b.handle === (args.includes('--blog-handle') ? get('--blog-handle') : 'news'));
  if (!blog) throw new Error('Target blog not found; refusing to create or change a blog');
  report.blog = blog;
  const existing = new Map();
  let after = null;
  do {
    const page = await api('query($id:ID!,$after:String){ blog(id:$id){ articles(first:100,after:$after){ nodes{id handle title body isPublished publishedAt} pageInfo{hasNextPage endCursor} } } }', { id: blog.id, after });
    for (const article of page.blog.articles.nodes) existing.set(article.handle, article);
    after = page.blog.articles.pageInfo.hasNextPage ? page.blog.articles.pageInfo.endCursor : null;
  } while (after);
  for (const record of records) {
    try {
      let article = existing.get(record.slug);
      let action = 'verified-existing';
      if (article) {
        try {
          assertDraft(article, record);
        } catch (error) {
          if (!args.includes('--reconcile-from')) throw error;
          // Only this run's unchanged, recorded drafts may receive a reviewed copy correction.
          assertOwnedReconciliation(article, prior.find(r => r.articleId === article.id));
          const updated = await api('mutation($id:ID!,$article:ArticleUpdateInput!){articleUpdate(id:$id,article:$article){article{id} userErrors{field message}}}', { id: article.id, article: { body: record.body, title: record.title, isPublished: false } });
          if (updated.articleUpdate.userErrors.length) throw new Error(JSON.stringify(updated.articleUpdate.userErrors));
          article = (await api('query($id:ID!){article(id:$id){id handle title body isPublished publishedAt}}', { id: article.id })).article;
          assertDraft(article, record);
          action = 'owned-draft-corrected-and-readback-verified';
        }
      } else {
        const created = await api('mutation($article:ArticleCreateInput!){articleCreate(article:$article){article{id handle title body isPublished publishedAt} userErrors{field message code}}}', { article: buildArticleInput(record, blog.id) });
        if (created.articleCreate.userErrors.length) throw new Error(JSON.stringify(created.articleCreate.userErrors));
        const id = created.articleCreate.article?.id;
        if (!id) throw new Error('Shopify did not return an article ID');
        article = (await api('query($id:ID!){article(id:$id){id handle title body isPublished publishedAt}}', { id })).article;
        assertDraft(article, record);
        action = 'created-and-readback-verified';
      }
      const id = article.id.split('/').at(-1);
      report.records.push({ calendarId: record.calendarId, slug: record.slug, title: article.title, articleId: article.id, action, isPublished: false, publishedAt: null, sha256: createHash('sha256').update(article.body).digest('hex'), adminUrl: `https://admin.shopify.com/store/${domain.split('.')[0]}/articles/${id}` });
      console.log(`${record.calendarId}: ${action}`);
    } catch (error) {
      report.records.push({ calendarId: record.calendarId, slug: record.slug, error: error.message });
      process.exitCode = 1;
    }
    report.checkedAt = new Date().toISOString();
    await fs.writeFile(out, JSON.stringify(report, null, 2));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
