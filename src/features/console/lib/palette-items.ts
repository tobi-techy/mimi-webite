import type { HelperName } from "@/features/console/demo/types";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { consoleRoutes, shopHref } from "@/features/console/config";
import { settingsHref, settingsNav, findSettingsSection } from "@/features/console/content/settings";
import { shops } from "@/features/console/content/shops";
import { naira } from "@/features/console/lib/format";

export const paletteTabs = ["All", "Threads", "Shops", "Pages", "Settings", "Actions"] as const;
export type PaletteTab = (typeof paletteTabs)[number];
export type PaletteGroup = Exclude<PaletteTab, "All">;

export const lookBacks = ["7d", "30d", "90d", "All"] as const;
export type LookBack = (typeof lookBacks)[number];
const LOOK_BACK_DAYS: Record<LookBack, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  All: Number.POSITIVE_INFINITY,
};

export type PaletteItem = {
  id: string;
  group: PaletteGroup;
  title: string;
  meta: string;
  icon: IconName;
  avatar?: boolean;
  /** Settings rows: only shown when searching. */
  deep?: boolean;
  href?: string;
  action?: "pauseAll" | "addShop" | "playDemo" | "walkDemo" | "resetDemo" | "stopDemo";
  /** Helper face instead of an icon (demo threads). */
  face?: HelperName | "Mimi";
};

export const groupHeading: Record<PaletteGroup, string> = {
  Threads: "Recent threads",
  Shops: "Shops",
  Pages: "Pages",
  Settings: "Settings",
  Actions: "Actions",
};

function paletteItems(lookBack: LookBack, live: PaletteItem[]): PaletteItem[] {
  const items: PaletteItem[] = lookBack === "All" ? [...live] : live.slice(0, LOOK_BACK_DAYS[lookBack] > 30 ? live.length : 12);
  shops.forEach((s) =>
    items.push({
      id: `s-${s.id}`,
      group: "Shops",
      icon: "store",
      avatar: true,
      title: s.name,
      meta: `${s.owner} · ${s.route} · ${naira(s.owed)} owed`,
      href: shopHref(s.id),
    }),
  );
  (
    [
      ["Threads", "messages-square", consoleRoutes.threads],
      ["Needs you", "check", consoleRoutes.home],
      ["Shops", "store", consoleRoutes.shops],
      ["Credit", "landmark", consoleRoutes.credit],
      ["Automations", "refresh-cw", consoleRoutes.automations],
      ["Computers", "monitor", settingsHref("computers")],
    ] as const
  ).forEach(([title, icon, href]) =>
    items.push({ id: `p-${title}`, group: "Pages", icon, title, meta: "Page", href }),
  );
  settingsNav.forEach((g) =>
    g.ids.forEach((id) => {
      const s = findSettingsSection(id);
      if (!s) return;
      items.push({
        id: `set-${id}`,
        group: "Settings",
        icon: s.icon,
        title: s.title,
        meta: `Settings · ${g.title}`,
        href: settingsHref(id),
      });
      s.groups.forEach((grp) => {
        if (!("rows" in grp)) return;
        grp.rows
          .filter((r) => !r.avatar)
          .forEach((r) =>
            items.push({
              id: `set-${id}-${r.title}`,
              group: "Settings",
              icon: s.icon,
              title: r.title,
              meta: `Settings · ${s.title}${grp.title ? ` · ${grp.title}` : ""}`,
              deep: true,
              href: settingsHref(id),
            }),
          );
      });
    }),
  );
  items.push(
    {
      id: "a-walk",
      group: "Actions",
      icon: "list-checks",
      title: "Walk through with chips",
      meta: "Start the collections story and tap the replies yourself",
      action: "walkDemo",
    },
    {
      id: "a-play",
      group: "Actions",
      icon: "zap",
      title: "Play demo",
      meta: "Auto-play the collections story (about 75 seconds)",
      action: "playDemo",
    },
    {
      id: "a-reset",
      group: "Actions",
      icon: "refresh-cw",
      title: "Reset demo",
      meta: "Put every thread, doc and card back to the start",
      action: "resetDemo",
    },
    {
      id: "a-new",
      group: "Actions",
      icon: "plus",
      title: "New thread",
      meta: "Start a fresh Mimi thread",
      href: `${consoleRoutes.home}#new`,
    },
    {
      id: "a-shop",
      group: "Actions",
      icon: "store",
      title: "Add a shop",
      meta: "Invite a shop by WhatsApp number",
      href: consoleRoutes.shops,
      action: "addShop",
    },
    {
      id: "a-pause",
      group: "Actions",
      icon: "pause",
      title: "Pause all computers",
      meta: "Stops every running computer",
      action: "pauseAll",
    },
  );
  return items;
}

/** What the palette lists for a query, tab and look-back window, grouped in display order. */
export function paletteSections(
  query: string,
  tab: PaletteTab,
  lookBack: LookBack,
  live: PaletteItem[] = [],
): Array<[PaletteGroup, PaletteItem[]]> {
  const all = paletteItems(lookBack, live);
  const q = query.trim().toLowerCase();
  const of = (g: PaletteGroup) => all.filter((it) => it.group === g);
  if (!q && tab === "All")
    return [
      ["Threads", of("Threads").slice(0, 8)],
      ["Actions", of("Actions")],
    ];
  const groups = paletteTabs.slice(1).filter((g): g is PaletteGroup => tab === "All" || tab === g);
  return groups.map((g) => {
    const m = of(g).filter((it) => (q ? `${it.title} ${it.meta}`.toLowerCase().includes(q) : !it.deep));
    return [g, tab === "All" ? m.slice(0, 6) : m];
  });
}
