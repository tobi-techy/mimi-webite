"use client";

import Link from "next/link";
import { useState } from "react";
import { ChannelIcon, Crumbs, WelcomeModal, autoRoutes, openWelcome } from "@/features/console/components/automations/parts";
import { HelperFace } from "@/features/console/components/helpers/HelperFace";
import { Icon } from "@/features/console/components/ui/Icon";
import { templates, triggerLabel, type Channel } from "@/features/console/content/automations";
import { helperNames } from "@/features/console/demo/types";

const WORKS_WITH: Channel[] = ["whatsapp", "bank", "email", "sheet"];

/** /console/automations/templates: the hero (the one place the orange gradient lives), search, template grid. */
export function TemplatesGallery() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const list = templates.filter((t) => !query || `${t.title} ${t.description} ${t.helper}`.toLowerCase().includes(query));
  return (
    <>
      <Crumbs items={[{ label: "Automations", href: autoRoutes.list }, { label: "Templates" }]} />
      <section className="x-ahero" aria-labelledby="ah-t">
        <div className="x-ahero__tx">
          <h1 id="ah-t">Put the jobs that keep coming back on autopilot</h1>
          <p>Start from a proven use case or describe your own. A helper sets it up with you, then runs it every time its trigger fires. You still approve anything that reaches a shop.</p>
          <div className="x-ahero__acts">
            <Link className="x-abtn x-abtn--or" href={autoRoutes.newFrom()}>
              <Icon name="sparkles" />
              Create with Mimi
            </Link>
            <button type="button" className="x-abtn x-abtn--glass" onClick={openWelcome}>
              <Icon name="book-open" />
              How automations work
            </button>
          </div>
          <p className="x-ahero__ww">
            <span>Works with</span>
            {WORKS_WITH.map((c) => (
              <ChannelIcon key={c} c={c} size="md" />
            ))}
            <span className="x-ahero__faces">
              {helperNames.map((h) => (
                <HelperFace key={h} name={h} size={22} />
              ))}
            </span>
          </p>
        </div>
        <div className="x-ahero__mark" aria-hidden="true">
          <HelperFace name="Mimi" size={150} />
        </div>
      </section>
      <label className="x-search x-asearch x-asearch--t">
        <Icon name="search" />
        <input type="search" value={q} placeholder="Search templates" aria-label="Search templates" onChange={(e) => setQ(e.target.value)} />
      </label>
      <p className="x-acap">Popular use cases · {list.length}</p>
      <p className="x-acap__s">Jobs distributors automate most, with the instructions and trigger filled in. Point one at your shops, then turn it on.</p>
      <ul className="x-agrid">
        {list.map((t) => (
          <li key={t.id}>
            <Link className="x-atpl" href={autoRoutes.newFrom(t.id)}>
              <span className="x-atpl__top">
                <HelperFace name={t.helper} size={22} />
                <span className="x-atpl__trg">
                  <Icon name={t.trigger.kind === "schedule" ? "calendar-clock" : "zap"} />
                  {triggerLabel(t.trigger)}
                </span>
              </span>
              <b>{t.title}</b>
              <span className="x-atpl__d">{t.description}</span>
              <span className="x-atpl__ch">
                {t.channels.map((c) => (
                  <ChannelIcon key={c} c={c} />
                ))}
                <span className="x-atpl__by">{t.helper}</span>
              </span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li className="x-atbl__empty">No templates match “{q}”</li>}
      </ul>
      <WelcomeModal />
    </>
  );
}
