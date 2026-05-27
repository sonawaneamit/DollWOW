export const analyticsEvents = {
  viewProduct: "view_product",
  startHelpMeChoose: "start_help_me_choose",
  completeHelpMeChoose: "complete_help_me_choose",
  submitCompareListing: "submit_compare_listing",
  viewComparisonResult: "view_comparison_result",
  askHumanHelp: "ask_human_help",
  addToCart: "add_to_cart",
  beginCheckout: "begin_checkout"
} as const;

export function trackServerEvent(event: string, properties: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", event, properties);
  }
}
