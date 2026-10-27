"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AutoDiagram, ChannelIcon, WelcomeModal, autoRoutes, openWelcome } from "@/features/console/components/automations/parts";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { Picker } from "@/features/console/components/ui/Picker";
import { ShopAvatar } from "@/features/console/components/ui/ShopAvatar";
import { scopeLabel, triggerLabel, type Automation } from "@/features/console/content/automations";
import { shops } from "@/features/console/content/shops";
import { toggleAutomation } from "@/features/console/demo/engine";
import { useDemo } from "@/features/console/demo/store";
import { helperNames } from "@/features/console/demo/types";
import { useToast } from "@/features/console/hooks/use-toast";
import { sfx } from "@/lib/sound";
import { cx } from "@/lib/cx";

const TABS = ["Private", "Shared"] as const;
type Tab = (typeof TABS)[number];

/** A few faces of the shops an automation runs on. */
export function ScopeFaces({ a }: { a: Automation }) {
  const names =
    a.scope.mode === "list"
      ? (a.scope.shops ?? [])
      : a.scope.mode === "area"
        ? shops.filter((s) => s.route === a.scope.area).map((s) => s.name)
        : shops.map((s) => s.name).slice(a.id.length % 6);
  return (
    <span className="x-asf" aria-hidden="true">
      {names.slice(0, 3).map((n) => (
        <ShopAvatar key={n} name={n} size={20} />
      ))}
    </span>
  );
}

/** /console/automations: Factory's list (tabs, search + helper filter, table) over every automation. */
export function AutomationsList() {
  const autos = useDemo((s) => s.autos);
  const on = useDemo((s) => s.automations);
  const router = useRouter();
  const say = useToast();
  const [tab, setTab] = useState<Tab>("Private");
  const [q, setQ] = useState("");
  const [helper, setHelper] = useState("All helpers");
  const inTab = (a: Automation, t: Tab) => (t === "Shared" ? !!a.shared : !a.shared);
  const query = q.trim().toLowerCase();
  const shown = autos.filter(
    (a) =>
      inTab(a, tab) &&
      (helper === "All helpers" || a.helper === helper) &&
      (!query || `${a.title} ${a.description} ${a.helper} ${triggerLabel(a.trigger)}`.toLowerCase().includes(query)),
  );
  return (
    <>
      <div className="x-alh">
        <h1 className="x-alh__t">Automations</h1>
        <button type="button" className="x-abtn x-abtn--ghost" onClick={openWelcome}>
          <Icon name="book-open" />
          How automations work
        </button>
        <Link className="x-abtn" href={autoRoutes.templates}>
          Templates
        </Link>
        <Link className="x-abtn x-abtn--or" href={autoRoutes.templates}>
          <Icon name="plus" />
          New automation
        </Link>
      </div>
      <div className="x-atabs" role="tablist" aria-label="Automations">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={cx(tab === t && "is-on")} onClick={() => setTab(t)}>
            {t} <span>{autos.filter((a) => inTab(a, t)).length}</span>
          </button>
        ))}
      </div>
      <div className="x-atools">
        <label className="x-search x-asearch">
          <Icon name="search" />
          <input type="search" value={q} placeholder="Search automations" aria-label="Search automations" onChange={(e) => setQ(e.target.value)} />
        </label>
        <Picker
          label="Filter by helper"
          variant="plain"
          value={helper}
          lead={<Icon name="filter" />}
          onChange={setHelper}
          options={[{ value: "All helpers" }, ...helperNames.map((h) => ({ value: h }))]}
        />
      </div>
      <div className="x-atbl" role="table" aria-label="Automations">
        <div className="x-atbl__h" role="row">
          <span role="columnheader">Title</span>
          <span role="columnheader">Trigger type</span>
          <span role="columnheader">Runs on</span>
          <span role="columnheader">Last run</span>
          <span role="columnheader" className="sr-only">
            On
          </span>
        </div>
        {shown.length === 0 && (
          <div className="x-atbl__empty" role="row">
            <Icon name="search" />
            <span role="cell">No automations match the current filters</span>
          </div>
        )}
        {shown.map((a) => {
          const last = a.runs[0];
          const live = !!on[a.id];
          return (
            <div key={a.id} role="row" className={cx("x-atbl__r", !live && "is-off")} onClick={() => router.push(autoRoutes.detail(a.id, a.created))}>
              <span role="cell" className="x-atbl__ti">
                <HelperFace name={a.helper} size={24} />
                <span>
                  <Link href={autoRoutes.detail(a.id, a.created)} onClick={(e) => e.stopPropagation()}>
                    {a.title}
                  </Link>
                  <small>{a.description}</small>
                </span>
              </span>
              <span role="cell" className="x-atbl__tr">
                <Icon name={a.trigger.kind === "schedule" ? "calendar-clock" : "zap"} />
                <span>
                  {a.trigger.kind === "schedule" ? "Schedule" : "Event"}
                  <small>{triggerLabel(a.trigger)}</small>
                </span>
              </span>
              <span role="cell" className="x-atbl__on">
                <ScopeFaces a={a} />
                <span>
                  {a.helper}
                  <small>{scopeLabel(a.scope)}</small>
                </span>
              </span>
              <span role="cell" className="x-atbl__lr">
                {last ? (
                  <>
                    <i className={cx("x-ast", `x-ast--${last.status}`)} aria-hidden="true" />
                    <span>
                      {last.at}
                      <small>{last.status === "needs" ? "Needs you" : last.status === "failed" ? "Failed, retried" : last.status === "run" ? "Running" : "Done"}</small>
                    </span>
                  </>
                ) : (
                  <small>Never</small>
                )}
              </span>
              <span role="cell" className="x-atbl__sw">
                <span className="x-atbl__chs" aria-hidden="true">
                  {a.channels.map((c) => (
                    <ChannelIcon key={c} c={c} />
                  ))}
                </span>
                <button
                  className="c-toggle"
                  type="button"
                  role="switch"
                  aria-checked={live}
                  aria-label={`${a.title} on`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAutomation(a.id, !live);
                    sfx("console", "toggle", { direction: !live ? "forward" : "back" });
                    say(`${a.title} ${!live ? "turned on" : "paused"}`);
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>
      <div className="x-anote">
        <AutoDiagram trigger="EVERY MONDAY 8AM" helper="Collector" result="WHATSAPP TO OWNER" />
        <p>
          Every run opens its own thread with the helper&apos;s reasoning and steps. Mimi proposes, code checks, you approve. Money never moves on its
          own.
        </p>
      </div>
      <WelcomeModal />
    </>
  );
}
