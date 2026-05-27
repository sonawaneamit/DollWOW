export type CrawlerResult = {
  sourceUrl: string;
  title?: string;
  price?: number;
  shippingPrice?: number;
  currency?: string;
  imageUrls?: string[];
  specs?: Record<string, string | number | boolean>;
  lastCheckedAt: string;
};

export interface CompetitorCrawler {
  crawlVendor(domain: string): Promise<CrawlerResult[]>;
}

export class DisabledCrawler implements CompetitorCrawler {
  async crawlVendor() {
    return [];
  }
}
