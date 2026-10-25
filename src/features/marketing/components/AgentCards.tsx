import type { CSSProperties, ReactNode } from "react";
import { StatusTag } from "@/components/ui/Tag";
import type { AgentSummary } from "@/features/marketing/content/home";

/** Grid of small agent cards (`.x-agents`): status, name and one line. */
export function AgentCards({ agents, style }: { agents: readonly AgentSummary[]; style?: CSSProperties }) {
  return (
    <div className="x-agents" style={style}>
      {agents.map((a) => (
        <div key={a.name} className="x-agent">
          <StatusTag status={a.status}>{a.statusLabel}</StatusTag>
          <h3>{a.name}</h3>
          {a.outcome && <p>{a.outcome}</p>}
        </div>
      ))}
    </div>
  );
}

/** Grid of numbered job cards (the shops page). */
export function JobCards({
  jobs,
  reveal,
  style,
}: {
  jobs: ReadonlyArray<{ title: string; body: ReactNode }>;
  reveal?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={reveal ? "x-agents x-rv" : "x-agents"} style={style}>
      {jobs.map((j, i) => (
        <div key={j.title} className="x-agent">
          <span className="x-job__n">{String(i + 1).padStart(2, "0")}</span>
          <h3>{j.title}</h3>
          <p>{j.body}</p>
        </div>
      ))}
    </div>
  );
}
