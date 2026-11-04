import type { HelperName } from "@/features/console/demo/types";
import type { IconName } from "@/features/console/components/ui/icon-paths";
import { USES_API } from "@/features/console/api/config";
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
  const items: PaletteItem[] =
    lookBack === "All" ? [...live] : live.slice(0, LOOK_BACK_DAYS[lookBack] > 30 ? live.length : 12);
  /* the API build lists only what is real: its threads, its pages, its settings (no sample shops or demo actions) */
  if (USES_API) return [...items, ...apiPages()];
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
      ["Waiting on you", "check", consoleRoutes.needs],
      ["Shops", "store", consoleRoutes.shops],
      ["Credit", "landmark", consoleRoutes.credit],
      ["Money at risk", "gauge", consoleRoutes.money],
      ["Returns", "package", consoleRoutes.returns],
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
      meta: "One morning with Mimi in five short scenes",
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
      href: consoleRoutes.newThread,
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

function apiPages(): PaletteItem[] {
  const pages = (
    [
      ["Threads", "messages-square", consoleRoutes.threads],
      ["Waiting on you", "check", consoleRoutes.needs],
      ["Shops", "store", consoleRoutes.shops],
      ["Credit", "landmark", consoleRoutes.credit],
      ["Money at risk", "gauge", consoleRoutes.money],
      ["Returns", "package", consoleRoutes.returns],
    ] as const
  ).map(([title, icon, href]): PaletteItem => ({
    id: `p-${title}`,
    group: "Pages",
    icon,
    title,
    meta: "Page",
    href,
  }));
  const sets = settingsNav.flatMap((g) =>
    g.ids.flatMap((id): PaletteItem[] => {
      const s = findSettingsSection(id);
      return s
        ? [
            {
              id: `set-${id}`,
              group: "Settings",
              icon: s.icon,
              title: s.title,
              meta: `Settings · ${g.title}`,
              href: settingsHref(id),
            },
          ]
        : [];
    }),
  );
  /* New thread is a real route in the API build too (Composer and ThreadChat link to it), so it
     stays in the palette. The rest of the sample actions (play the story, add a shop) do not. */
  const actions: PaletteItem[] = [
    {
      id: "a-new",
      group: "Actions",
      icon: "plus",
      title: "New thread",
      meta: "Start a fresh Mimi thread",
      href: consoleRoutes.newThread,
    },
  ];
  return [...pages, ...sets, ...actions];
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
  const sections = groups.map((g): [PaletteGroup, PaletteItem[]] => {
    const m = of(g).filter((it) => (q ? `${it.title} ${it.meta}`.toLowerCase().includes(q) : !it.deep));
    return [g, tab === "All" ? m.slice(0, 6) : m];
  });
  if (!q) return sections;
  /* a group with a title match goes first, so "Waiting on you" + Enter opens the pile, not a thread whose status says it */
  const named = ([, m]: [PaletteGroup, PaletteItem[]]) => m.some((it) => it.title.toLowerCase().includes(q));
  return [...sections.filter(named), ...sections.filter((s) => !named(s))];
}
