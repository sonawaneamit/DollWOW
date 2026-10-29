import { expect, it } from 'vitest';
import { approvedPaidCreditOrder, DOLLVUE_CREDIT_PACKS } from '@/lib/dollvue/creditPacks';

function fixture(index = 0) {
  const p = DOLLVUE_CREDIT_PACKS[index];
  return { id: 100, email: ' TEST@example.invalid ', currency: 'USD', financial_status: 'paid', test: false,
    cancelled_at: null, total_price: (p.priceCents / 100).toFixed(2), line_items: [{ id: 200,
      product_id: Number(p.productId), variant_id: Number(p.variantId), quantity: 1,
      price: (p.priceCents / 100).toFixed(2), total_discount: '0.00', properties: [{ name: 'credits', value: '9999' }] }] };
}

it.each([0, 1, 2])('resolves only approved pack%j from exact product/variant identity', index => {
  const grant = approvedPaidCreditOrder(fixture(index));
  expect(grant?.email).toBe('test@example.invalid');
  expect(grant?.lines[0].credits).toBe([5, 12, 30][index]);
});

it('multiplies only validated line quantity, not browser-supplied credit properties', () => {
  const order = fixture(2);order.line_items[0].quantity = 2;order.total_price = '50.00';
  expect(approvedPaidCreditOrder(order)?.lines[0].credits).toBe(60);
});

it('uses zero discount only when omitted and rejects cancelled orders', () => {
  const order = fixture();
  expect(approvedPaidCreditOrder({ ...order, line_items: [{ ...order.line_items[0], total_discount: undefined }] })?.lines[0].credits).toBe(5);
  expect(() => approvedPaidCreditOrder({ ...order, cancelled_at: '2026-10-29T00:00:00Z' })).toThrow();
});

it.each([
  (o: ReturnType<typeof fixture>) => { o.financial_status = 'pending'; },
  (o: ReturnType<typeof fixture>) => { o.test = true; },
  (o: ReturnType<typeof fixture>) => { o.currency = 'EUR'; },
  (o: ReturnType<typeof fixture>) => { o.line_items[0].price = '0.00'; },
  (o: ReturnType<typeof fixture>) => { o.line_items[0].total_discount = '5.00'; },
  (o: ReturnType<typeof fixture>) => { o.total_price = '0.00'; },
  (o: ReturnType<typeof fixture>) => { o.line_items[0].quantity = -1; },
  (o: ReturnType<typeof fixture>) => { o.line_items[0].product_id = 123; },
  (o: ReturnType<typeof fixture>) => { o.line_items[0].variant_id = 123; },
  (o: ReturnType<typeof fixture>) => { o.line_items.push(o.line_items[0]); },
])('rejects unpaid, discounted, forged or malformed grants%#', change => {
  const order = fixture();change(order);expect(() => approvedPaidCreditOrder(order)).toThrow();
});
