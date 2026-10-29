import 'server-only';
import { z } from 'zod';

export const DOLLVUE_CREDIT_PACKS = [
  { credits: 5, priceCents: 500, productId: '10690909143224', variantId: '54582404743352' },
  { credits: 12, priceCents: 1000, productId: '10690930016440', variantId: '54582430269624' },
  { credits: 30, priceCents: 2500, productId: '10690930081976', variantId: '54582430367928' },
] as const;

const id = z.union([z.number().int().positive().max(Number.MAX_SAFE_INTEGER), z.string().regex(/^[1-9]\d{0,18}$/)]).transform(String);
const money = z.string().regex(/^\d{1,10}(?:\.\d{1,2})?$/).transform(value => Math.round(Number(value) * 100));
const orderSchema = z.object({
  id, email: z.string().trim().email().max(180).transform(value => value.toLowerCase()),
  currency: z.literal('USD'), financial_status: z.literal('paid'), test: z.literal(false),
  cancelled_at: z.null().optional(), total_price: money,
  line_items: z.array(z.object({ id, product_id: id, variant_id: id,
    quantity: z.number().int().min(1).max(100), price: money,
    total_discount: money.default(0),
  })).min(1).max(100),
});

/** Server-side grant proposal only: caller must first verify signature/shop/topic.
 * No credits are issued here, and buyer-supplied properties never define a pack.
 */
export function approvedPaidCreditOrder(payload: unknown) {
  const order = orderSchema.parse(payload);
  const seen = new Set<string>();
  const lines = order.line_items.flatMap(line => {
    if (seen.has(line.id)) throw new Error('Duplicate order line');
    seen.add(line.id);
    const pack = DOLLVUE_CREDIT_PACKS.find(item => item.variantId === line.variant_id);
    if (!pack) {
      if (DOLLVUE_CREDIT_PACKS.some(item => item.productId === line.product_id)) throw new Error('Unapproved pack variant');
      return [];
    }
    if (pack.productId !== line.product_id || pack.priceCents !== line.price || line.total_discount !== 0) {
      throw new Error('Credit pack payment requires review');
    }
    return [{ lineId: line.id, productId: pack.productId, variantId: pack.variantId,
      quantity: line.quantity, credits: pack.credits * line.quantity, paidCents: pack.priceCents * line.quantity }];
  });
  if (!lines.length) return null;
  if (order.total_price < lines.reduce((total, line) => total + line.paidCents, 0)) throw new Error('Insufficient paid order total');
  return { orderId: order.id, email: order.email, currency: order.currency, lines };
}
