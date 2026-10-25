"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ComputerScreen } from "@/features/console/components/computers/ComputerScreen";
import { ActionGroup } from "@/features/console/components/ui/ActionGroup";
import { EmptyState } from "@/features/console/components/ui/EmptyState";
import { Icon } from "@/features/console/components/ui/Icon";
import { SearchField } from "@/features/console/components/ui/SearchField";
import { Segmented } from "@/features/console/components/ui/Segmented";
import { threadHref } from "@/features/console/config";
import type { Computer } from "@/features/console/content/computers";
import { useComputers } from "@/features/console/hooks/use-computers";
import { useToast } from "@/features/console/hooks/use-toast";
import { computersStore } from "@/features/console/lib/computers-store";
import { cx } from "@/lib/cx";

type Filter = "all" | "on" | "off";
/** The computer working the demo thread opens that thread; the rest just say so. */
const THREAD_COMPUTER = "wigmore-01";

/** Settings > Computers: every computer with a live thumbnail, search, status tabs, wake/pause. */
export function ComputersGrid() {
  const router = useRouter();
  const say = useToast();
  const list = useComputers();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const running = list.filter((c) => c.running).length;
  const query = q.trim().toLowerCase();
  const shown = list.filter(
    (c) =>
      (filter === "all" || (filter === "on") === c.running) &&
      (!query || `${c.name} ${c.role} ${c.task}`.toLowerCase().includes(query)),
  );

  function open(c: Computer) {
    if (c.name === THREAD_COMPUTER) router.push(threadHref("chase-oshodi-shops"));
    else say(`Opening ${c.name}`);
  }
  function power(c: Computer) {
    computersStore.toggle(c.name);
    say(`${c.name} ${c.running ? "paused" : "is awake"}`);
  }

  return (
    <>
      <div className="x-ltools">
        <SearchField label="Search computers" value={q} onChange={setQ} />
        <Segmented
          label="Computer status"
          value={filter}
          onChange={setFilter}
          segments={[
            { value: "all", label: "All", count: list.length },
            { value: "on", label: "Running", count: running },
            { value: "off", label: "Asleep", count: list.length - running },
          ]}
        />
        <span className="x-grow"></span>
        <span className="x-meta">Region · Maritime</span>
      </div>
      {shown.length === 0 ? (
        <EmptyState>No computers match the current filters</EmptyState>
      ) : (
        <div className="x-cgrid3">
          {shown.map((c) => (
            <article key={c.name} className="x-comp" onClick={() => open(c)}>
              <div className={cx("x-thumb", !c.running && "is-asleep")} aria-hidden="true">
                <div className="x-tchrome">
                  <span className="x-dots">
                    <i></i>
                    <i></i>
                    <i></i>
                  </span>
                  <span>{c.running ? c.url : "about:blank"}</span>
                </div>
                <ComputerScreen kind={c.running ? c.screen : "idle"} />
                {!c.running && (
                  <div className="x-zz">
                    <span>
                      <Icon name="moon" />
                      Asleep
                    </span>
                  </div>
                )}
              </div>
              <div className="x-cbody">
                <div className="x-chd">
                  <p className="x-cname">
                    {c.name}
                    <span> · {c.role}</span>
                  </p>
                  <span className="x-cst">
                    <span className={cx("x-sd", c.running && "x-g")}></span>
                    {c.running ? "Running" : "Asleep"}
                  </span>
                </div>
                <p className="x-ctask">{c.task}</p>
                <p className="x-meta x-num">{c.uptime}</p>
                <div className="x-cbtns">
                  <ActionGroup
                    row
                    label={`Actions for ${c.name}`}
                    actions={["Open", c.running ? "Pause" : "Wake"]}
                    onAction={(a) => (a === "Open" ? open(c) : power(c))}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
