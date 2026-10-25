import { BootLoader } from "@/components/layout/BootLoader";

/**
 * "Opening your book": shown on the first console visit of a session. The boot script decides
 * before paint (`html.x-loading`) and runs the timing (min 400ms, cap 1000ms), so this is markup only.
 */
export function ConsoleLoader() {
  return <BootLoader label="Opening your book" />;
}
