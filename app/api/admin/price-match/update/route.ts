import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPriceMatchCustomerReply } from "@/lib/email/adminAlerts";
import { resolveApprovedDiscountAmount } from "@/lib/compare/reviewDecision";
import { createPriceMatchDiscountCode } from "@/lib/shopify/admin";
import { productPublicTitle } from "@/lib/catalog/naming";
import { getProductByHandle, getProducts } from "@/lib/shopify/storefront";
import { getComparisonRequest, updateComparisonRequestReview } from "@/lib/supabase/repositories";

const schema = z.object({
  id: z.string().uuid(),
  adminStatus: z.enum(["new", "in_review", "approved", "declined", "sent_code"]),
  adminNotes: z.string().max(5000).optional(),
  reviewedBy: z.string().max(200).optional(),
  approvedDiscountAmount: z.coerce.number().min(0).optional(),
  approvedDiscountCurrency: z.enum(["USD", "CAD", "GBP", "EUR"]).optional(),
  sendReply: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const current = await getComparisonRequest(input.id);
    if (!current) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    let patch: Parameters<typeof updateComparisonRequestReview>[0] = input;

    if (input.sendReply) {
      if (!current.customerEmail) {
        return NextResponse.json({ error: "Customer email is required before sending a reply." }, { status: 400 });
      }

      const product =
        (current.targetProductHandle ? await getProductByHandle(current.targetProductHandle, { cache: "no-store" }) : undefined) ||
        (current.matchProductId ? (await getProducts({ first: 2000 })).find((item) => item.id === current.matchProductId) : undefined);
      const variant = product?.variants.find((item) => item.availableForSale) ?? product?.variants[0];
      const productUrl = product ? `${process.env.ADMIN_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://doll-wow.vercel.app"}/products/${product.handle}` : undefined;

      if (input.adminStatus === "approved") {
        if (!product || !variant) {
          return NextResponse.json(
            { error: "Approved reply could not be sent because the matched DollWow product is not available for checkout yet." },
            { status: 400 }
          );
        }

        const basePrice = Number(variant.price.amount);
        const currencyCode = input.approvedDiscountCurrency || current.quotedCurrency || variant.price.currencyCode;
        const discountAmount = resolveApprovedDiscountAmount({
          manualDiscountAmount: input.approvedDiscountAmount,
          basePrice,
          quotedPrice: current.quotedPrice
        });
        let discountCode = current.approvedDiscountCode;

        if (discountAmount > 0 && !discountCode) {
          discountCode = `DOLLWOW-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
          await createPriceMatchDiscountCode({
            title: `DollWow price match for ${productPublicTitle(product)}`,
            code: discountCode,
            startsAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            amountOff: discountAmount,
            currencyCode,
            productVariantIds: [variant.id]
          });
        }

        patch = {
          ...patch,
          adminStatus: "sent_code",
          approvedDiscountAmount: discountAmount,
          approvedDiscountCurrency: currencyCode,
          approvedDiscountCode: discountCode,
          customerReplySentAt: new Date().toISOString(),
          customerReplyKind: "approval"
        };
        const updated = await updateComparisonRequestReview(patch);
        if (!updated) {
          return NextResponse.json({ error: "Request not found." }, { status: 404 });
        }
        await sendPriceMatchCustomerReply({ request: updated, productUrl, isApproved: true });
        return NextResponse.json({ ok: true, request: updated });
      }

      patch = {
        ...patch,
        customerReplySentAt: new Date().toISOString(),
        customerReplyKind: "decline"
      };
      const updated = await updateComparisonRequestReview(patch);
      if (!updated) {
        return NextResponse.json({ error: "Request not found." }, { status: 404 });
      }
      await sendPriceMatchCustomerReply({ request: updated, productUrl, isApproved: false });
      return NextResponse.json({ ok: true, request: updated });
    }

    const updated = await updateComparisonRequestReview(patch);
    if (!updated) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update price match review." },
      { status: 400 }
    );
  }
}
