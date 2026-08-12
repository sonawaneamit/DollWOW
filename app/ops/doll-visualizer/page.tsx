import { redirect } from "next/navigation";
import { VISUALIZER_DEFAULT_PRODUCT_HANDLE, visualizerUrl } from "@/lib/doll-visualizer/config";

export default function DollVisualizerPilotPage() {
  redirect(visualizerUrl(VISUALIZER_DEFAULT_PRODUCT_HANDLE));
}
