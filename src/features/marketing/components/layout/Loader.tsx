import { BootLoader } from "@/components/layout/BootLoader";
import { motionConfig } from "@/config/motion";

/** First-load screen ("Loading the book"). Shown by the boot script via `html.x-loading`. */
export function Loader() {
  if (!motionConfig.loader) return null;
  return <BootLoader label="Loading the book" />;
}
