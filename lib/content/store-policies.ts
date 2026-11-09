// Policy copy approved by Martin on 9 November 2026.
export const contact = 'DollWow LLC · 777 Brickell Ave, Miami FL 33131, United States · hello@dollwow.com · +1-855-922-DOLL (+1-855-922-3655)';
export const policies = [
  {
    key: 'refund', title: 'Refund and return policy',
    sections: [
      ['Ready-to-ship cancellations and changes', 'You may request cancellation or modification of a ready-to-ship order within four hours of placing the order. After that four-hour window, ready-to-ship orders are not eligible for cancellation, modification, or a change-of-mind refund. Contact us immediately with your order number. A cancellation accepted within this window receives a full refund. This cancellation rule does not remove remedies for damage, an incorrect item, a defect, or rights that apply by law.'],
      ['Custom-order cancellations', 'For made-to-order purchases, the cancellation refund is 100% within four hours of payment, 95% after four and within eight hours, and 80% after eight and within 24 hours. After 24 hours, custom orders are locked for production. Orders cannot be canceled once shipped. Contact us promptly with your order number.'],
      ['Custom production and approval', 'Custom products are made to the confirmed configuration and are not ordinarily returnable for a change of mind once production begins. For custom builds, factory approval photos are provided before shipment where included in the listing. Ready-to-ship products have limited customization, and factory approval photos may not be available.'],
      ['Damage, an incorrect item, or a defect', 'Please report visible delivery damage, missing items, or an incorrect item within 24 hours of delivery where possible. Keep the packaging and send your order number, a description, and clear photos to hello@dollwow.com. If a defect becomes apparent later, contact us when you discover it. We review the evidence and the confirmed order to determine an appropriate repair, replacement, refund, or other resolution. Minor cosmetic shipping wear is assessed differently from major damage. These reporting requests do not remove rights that apply by law.'],
      ['Return authorization and costs', 'Contact us before returning an item. We will confirm whether a return is needed, the return destination, the packing instructions, and responsibility for costs. Return-related expenses are decided case by case. DollWOW aims to cover justified expenses needed to ensure you receive what you paid for and to put things right. Do not send a return to our business address without authorization; the appropriate destination may depend on the product and remedy.'],
      ['Refund processing', 'Approved refunds are returned to the original payment method. Allow 5–10 business days for processing; your payment provider may need additional time to show the credit.'],
      ['Contact', contact],
    ],
  },
  {
    key: 'shipping', title: 'Shipping policy',
    sections: [
      ['Availability and delivery estimates', 'We offer ready-to-ship warehouse products and made-to-order builds. Available destinations, shipping charges, and any product-specific delivery estimate are shown on the listing, at checkout, or confirmed by our team for your order. Stock and shipping availability are subject to verification before release.'],
      ['Ready-to-ship products', 'Our general estimate for a ready-to-ship order is approximately three business days for delivery, subject to the warehouse, destination, stock verification, and order review. Check the product listing for a more specific estimate. Customization is limited and factory approval photos may not be available.'],
      ['Made-to-order products', 'Our general estimate for custom production and delivery is approximately three weeks. The actual schedule depends on the factory, selected configuration, destination, and approval process. Product-specific estimates or the schedule confirmed for your order take precedence over this general estimate. Where included in the listing, we share factory photos or videos before shipment for approval.'],
      ['Packaging and tracking', 'Orders are packed discreetly in plain packaging. Tracking details are shared after shipment activation. Carrier tracking is the best source for progress after dispatch.'],
      ['Customs and import fees', 'International orders are subject to destination customs requirements. Buyers are responsible for applicable import fees unless the checkout or our written order confirmation expressly states that those fees are included. Do not assume that every destination or product is available; check your order’s shipping terms before payment.'],
      ['Delivery problems', 'For visible damage, a missing item, or an incorrect item, contact us promptly, preferably within 24 hours of delivery, with your order number, photos, and packaging retained for review. Contact us about a lost, delayed, or misdelivered shipment so we can investigate with the relevant carrier or supplier. The remedy and any related costs are assessed case by case under our refund and return policy.'],
      ['Contact', contact],
    ],
  },
  {
    key: 'terms', title: 'Terms of Service',
    sections: [
      ['About these terms', 'These terms apply to purchases and use of DollWOW’s store, operated by DollWow LLC. Read them together with our product listings, refund and return policy, shipping policy, and privacy policy. Contact us before ordering if any detail is unclear.'],
      ['Adults only', 'You must be at least 18 years old and meet any higher legal age requirement in your location to use this store or buy our products. You are responsible for checking whether a product may lawfully be purchased, imported, and possessed at your destination.'],
      ['Product information and configuration', 'Review the listing’s material, measurements, selected options, included items, availability, and delivery estimate before ordering. Factory photos, configuration choices, and available options can differ by product. Generated DollVue previews are visual aids and do not guarantee the final product’s exact appearance. Contact us to confirm a detail rather than assuming an option or accessory is included.'],
      ['Orders and payment', 'Orders are subject to stock verification, configuration review, and confirmation by our team. Supply accurate contact and delivery information. The currency, selected options, shipping, and applicable taxes or duties shown for your checkout form the order’s payment details. If an order requires correction or cannot be supplied as agreed, we will contact you to discuss the next step and any applicable refund.'],
      ['Production, shipping, and cancellation', 'Made-to-order production follows the confirmed build. Delivery times are estimates unless we expressly agree otherwise in writing. Cancellation and modification requests are governed by our refund and return policy, including the four-hour window for ready-to-ship orders. Shipping, customs, and delivery issues are governed by our shipping policy.'],
      ['Product problems and support', 'Contact hello@dollwow.com with your order number and evidence of any damage, incorrect item, or defect. We assess the confirmed order and the circumstances to determine an appropriate resolution under our refund and return policy. Do not return an item without authorization and a confirmed destination.'],
      ['Acceptable use and intellectual property', 'Do not use the store to commit fraud, interfere with its operation, access another person’s account or information without permission, or upload unlawful content. DollWOW and supplier images, branding, and other materials remain subject to their respective owners’ rights.'],
      ['Privacy', 'Our privacy policy explains how personal information is handled. You can manage optional analytics consent through the privacy settings link in the website footer.'],
      ['Your legal rights', 'Nothing in these terms or our related policies excludes or limits consumer rights or remedies that cannot lawfully be excluded.'],
      ['Contact', contact],
    ],
  },
] as const;

