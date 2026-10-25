"use client";

import { useState } from "react";
import { NavGroup } from "@/features/console/components/ui/NavGroup";
import { NavItem } from "@/features/console/components/ui/NavItem";
import { SearchField } from "@/features/console/components/ui/SearchField";
import { connectors } from "@/features/console/content/connectors";
import {
  findSettingsSection,
  settingsHref,
  settingsNav,
  type SettingsSection,
} from "@/features/console/content/settings";

/** Words a settings section can be found by: its title, group titles and row titles. */
function searchText(s: SettingsSection): string {
  const rows = s.groups.flatMap((g) => [g.title, ...("rows" in g ? g.rows.map((r) => r.title) : [])]);
  const extra = s.id === "connectors" ? ["integrations", ...connectors.map((c) => c.name)] : [];
  return [s.title, ...rows, ...extra].join(" ").toLowerCase();
}

/** Settings sections with a filter field (`Search settings`). */
export function SettingsNav() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  return (
    <>
      <SearchField label="Search settings" value={q} onChange={setQ} />
      {settingsNav.map((group) => {
        const sections = group.ids
          .map(findSettingsSection)
          .filter((s): s is SettingsSection => !!s && (!query || searchText(s).includes(query)));
        if (!sections.length) return null;
        return (
          <NavGroup key={group.title} label={group.title} title={group.title}>
            {sections.map((s) => (
              <NavItem key={s.id} href={settingsHref(s.id)} icon={s.icon} label={s.title} exact />
            ))}
          </NavGroup>
        );
      })}
    </>
  );
}
