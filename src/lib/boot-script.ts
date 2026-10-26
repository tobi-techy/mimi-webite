import { motionConfig } from "@/config/motion";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/config/theme";
import { CONSOLE_ONLY } from "@/config/routes";
import { CONSOLE_LOADER_KEY } from "@/features/console/config";

/**
 * Runs in <head> before first paint:
 * - applies the saved theme (dark by default) so there is no flash,
 * - marks the document as JS-capable (`js`) and enables the motion start states (`motion-ready`),
 *   dropping `motion-ready` again if the motion layer never starts, so content is never left hidden,
 * - shows the first-visit loading screen (components/layout/BootLoader.tsx) once per session, on the
 *   marketing site and in the console (each has its own session key), never on client navigation.
 *
 * Loader timing: `html.x-loading` on, then `x-loading-out` (the handoff wipe) once the window has
 * loaded AND at least MIN ms have passed, or at CAP ms whatever happens; the classes come off when the
 * wipe is done. Under reduced motion the screen still shows but only fades (styles/boot-loader.css).
 */
const showLoader = motionConfig.loader ? "true" : "false";
const MIN_MS = 400;
const CAP_MS = 1000;
const OUT_MS = 500;
const OUT_REDUCED_MS = 220;
/* the console-only build (console.userail.money) has no marketing pages: every path is the console */
const isConsoleTest = CONSOLE_ONLY ? "true" : "/^\\/console(\\/|$)/.test(location.pathname)";

export const bootScript = `(function(){
var d=document.documentElement,c=d.classList;c.add("js","motion-ready");
var t="${DEFAULT_THEME}";try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");if(s==="light"||s==="dark")t=s}catch(e){}
d.setAttribute("data-theme",t);
var rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
var con=${isConsoleTest};
if(!con)addEventListener("load",function(){setTimeout(function(){if(!window.__mimiMotion)c.remove("motion-ready")},1500)});
if(!con&&!${showLoader})return;
var k=con?"${CONSOLE_LOADER_KEY}":"mimi-loaded",seen=false;
try{seen=sessionStorage.getItem(k)==="1";sessionStorage.setItem(k,"1")}catch(e){}
if(seen)return;
c.add("x-loading");
var start=Date.now(),loaded=document.readyState==="complete",gone=false,leaving=false;
function remove(){if(gone)return;gone=true;c.remove("x-loading","x-loading-out")}
function out(){if(gone||leaving)return;leaving=true;c.add("x-loading-out");setTimeout(remove,rm?${OUT_REDUCED_MS}:${OUT_MS})}
function maybe(){if(loaded&&Date.now()-start>=${MIN_MS})out()}
addEventListener("load",function(){loaded=true;setTimeout(maybe,Math.max(0,${MIN_MS}-(Date.now()-start)))});
setTimeout(maybe,${MIN_MS});setTimeout(out,${CAP_MS});setTimeout(remove,${CAP_MS + OUT_MS + 100});
})();`;
