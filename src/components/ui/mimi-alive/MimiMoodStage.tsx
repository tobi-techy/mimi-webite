"use client";

import { useState } from "react";
import { MimiAlive } from "./MimiAlive";
import { MOODS, type Mood } from "./engine";

const LIST = Object.keys(MOODS) as Mood[];

/** Mimi plus a row of mood chips, for the brand kit. */
export function MimiMoodStage() {
  const [mood, setMood] = useState<Mood>("idle");
  return (
    <div className="x-mimi-stage">
      <MimiAlive mood={mood} />
      <div className="x-mimi-stage__moods" role="group" aria-label="Mimi moods">
        {LIST.map((m) => (
          <button key={m} type="button" aria-pressed={m === mood} onClick={() => setMood(m)}>
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
