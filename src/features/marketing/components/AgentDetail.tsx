import type { ReactNode } from "react";
import { Photo, type PhotoSpec } from "@/components/ui/Photo";
import { Sticker, type StickerSpec } from "@/components/ui/Sticker";
import { StatusTag, type AgentStatus } from "@/components/ui/Tag";

export type AgentDetailSpec = {
  name: string;
  status: AgentStatus;
  statusLabel: string;
  outcome?: string;
  /** What the agent does. */
  does: string[];
  /** Planned additions ("Coming ..."). */
  coming?: string;
  photo?: PhotoSpec;
  /** Sticker on the photo, or on the card side when there is no photo. */
  sticker?: StickerSpec;
};

/** One agent in detail (`.x-ag`): number, name, status and outcome beside what it does. */
export function AgentDetail({ agent, index }: { agent: AgentDetailSpec; index: number }) {
  const list = (
    <ul className="x-ag__list">
      {agent.does.map((d) => (
        <li key={d}>{d}</li>
      ))}
    </ul>
  );
  let side: ReactNode = null;
  if (agent.photo)
    side = (
      <figure className="x-ag__photo x-ph">
        <Photo photo={agent.photo} />
        {agent.sticker && <Sticker {...agent.sticker} />}
      </figure>
    );
  else if (agent.sticker) side = <Sticker {...agent.sticker} />;
  return (
    <article className="x-ag x-grid x-rv">
      <div className="x-ag__side">
        <span className="x-ag__n">{String(index + 1).padStart(2, "0")}</span>
        <h3 className="x-d3">{agent.name}</h3>
        <StatusTag status={agent.status}>{agent.statusLabel}</StatusTag>
        {agent.outcome && <p className="x-ag__out">{agent.outcome}</p>}
        {side}
      </div>
      {agent.coming ? (
        <div className="x-ag__body">
          {list}
          <p className="x-ag__soon">
            <span className="x-label">Coming</span> {agent.coming}
          </p>
        </div>
      ) : (
        list
      )}
    </article>
  );
}
