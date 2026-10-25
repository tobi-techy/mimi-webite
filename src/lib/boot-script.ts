import { motionConfig } from "@/config/motion";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/config/theme";
import { CONSOLE_LOADER_KEY } from "@/features/console/config";

/**
 * Runs in <head> before first paint:
 * - applies the saved theme (dark by default) so there is no flash,
 * - marks the document as JS-capable (`js`) and enables the motion start states (`motion-ready`),
 *   dropping `motion-ready` again if the motion layer never starts, so content is never left hidden,
 * - on the marketing site, shows the first-load screen once per session (`x-loading`), never on
 *   client navigation, never under reduced motion, hard cap 1.5s,
 * - in the console, marks its own first-visit loader the same way (`c-loading`, once per session).
 */
const showLoader = motionConfig.loader ? "true" : "false";

export const bootScript = `(function(){
var d=document.documentElement,c=d.classList;c.add("js","motion-ready");
var t="${DEFAULT_THEME}";try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");if(s==="light"||s==="dark")t=s}catch(e){}
d.setAttribute("data-theme",t);
var rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
if(/^\\/console(\\/|$)/.test(location.pathname)){try{if(!rm&&!sessionStorage.getItem("${CONSOLE_LOADER_KEY}")){sessionStorage.setItem("${CONSOLE_LOADER_KEY}","1");c.add("c-loading")}}catch(e){}return}
addEventListener("load",function(){setTimeout(function(){if(!window.__mimiMotion)c.remove("motion-ready")},1500)});
if(!${showLoader})return;
var seen=false;try{seen=sessionStorage.getItem("mimi-loaded")==="1";sessionStorage.setItem("mimi-loaded","1")}catch(e){}
if(seen||rm)return;
c.add("x-loading");
var start=Date.now(),loaded=document.readyState==="complete",gone=false;
function remove(){if(gone)return;gone=true;c.remove("x-loading","x-loading-out")}
function out(){if(gone||c.contains("x-loading-out"))return;c.add("x-loading-out");setTimeout(remove,200)}
function maybe(){if(loaded&&Date.now()-start>=400)out()}
addEventListener("load",function(){loaded=true;setTimeout(maybe,Math.max(0,400-(Date.now()-start)))});
setTimeout(maybe,400);setTimeout(out,1000);setTimeout(remove,1200);
})();`;
