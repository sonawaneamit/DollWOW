import { redirect } from "next/navigation";

export const metadata = {
  title: "Price Match Request",
  description: "Compare another seller's listing with DollWow and request help reviewing the total price, product match, shipping, and support terms."
};

export default function PriceMatchPage() {
  redirect("/compare");
}
