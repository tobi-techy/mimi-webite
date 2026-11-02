import { AnswerTable } from "@/features/console/components/chat/answer/AnswerTable";
import { Deliverables } from "@/features/console/components/chat/answer/Deliverables";
import { Highlights } from "@/features/console/components/chat/answer/Highlights";
import { Inline } from "@/features/console/components/chat/answer/Inline";
import { StatCards } from "@/features/console/components/chat/answer/StatCards";
import { consoleThread } from "@/features/console/config";
import { WorkedFor } from "@/features/console/components/chat/answer/WorkedFor";
import type { AnswerBlock, Message, Source } from "@/features/console/demo/types";
import { cx } from "@/lib/cx";

export type AnswerMessage = Extract<Message, { kind: "answer" }>;

function Block({ b, cites }: { b: AnswerBlock; cites?: Record<number, Source> }) {
  switch (b.type) {
    case "text":
      return (
        <p className={cx("mc-ans__p", b.lead && "is-lead")}>
          <Inline text={b.text} cites={cites} />
        </p>
      );
    case "stats":
      return <StatCards items={b.items} />;
    case "table":
      return <AnswerTable columns={b.columns} rows={b.rows} files={b.files} label={b.label} />;
    case "highlights":
      return <Highlights title={b.title} items={b.items} cites={cites} />;
    case "deliverables":
      return <Deliverables title={b.title} cards={b.cards} rows={b.rows} visible={b.visible} />;
  }
}

/** A structured helper answer: Worked for, the plain one-sentence answer, then its blocks. */
export function Answer({ m }: { m: AnswerMessage }) {
  return (
    <div className="mc-ans">
      {m.worked && (consoleThread.showWork || consoleThread.showStepsLine) && <WorkedFor id={m.id} secs={m.worked.secs} work={m.worked.work} />}
      {m.blocks.map((b, i) => (
        <Block key={i} b={b} cites={m.cites} />
      ))}
    </div>
  );
}
