import { motionConfig } from "@/config/motion";

/** First-load screen ("Loading the book"). Shown by the boot script via `html.x-loading`. */
export function Loader() {
  if (!motionConfig.loader) return null;
  return (
    <div className="x-load" id="xLoad" role="status" aria-label="Loading">
      <img className="x-load__mark" src="/brand/mimi-mascot-blink.svg" alt="" aria-hidden="true" />{" "}
      <p className="x-label">Loading the book</p>
      <div className="x-load__bar" aria-hidden="true">
        <i></i>
      </div>
    </div>
  );
}
