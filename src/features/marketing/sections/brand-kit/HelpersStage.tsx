"use client";

import { Fragment, useState, type CSSProperties } from "react";
import { Helper, MimiHelperMark, type HelperState } from "@/components/helpers/Helper";
import { helperColour, type HelperExpression } from "@/components/helpers/rig.generated";
import {
  brandHelpers,
  helperExpressionLabels,
  helperFiles,
  helperStates,
  helpersMotion,
  helpersSystem,
  helpersZip,
} from "@/features/marketing/content/brand-kit";
import { cx } from "@/lib/cx";

type Look = "bright" | "ink" | "colour";

/**
 * The live helper set: pick a state (or let it cycle) and ink or colour tiles. Below it, the four states
 * strip and the twelve expressions. All motion is CSS from the rig; it holds still under reduced motion.
 */
export function HelpersStage() {
  const [state, setState] = useState<HelperState>("idle");
  const [look, setLook] = useState<Look>("bright");
  const [expr, setExpr] = useState<HelperExpression>("happy");

  return (
    <>
      <div className="x-bk-hbar x-rv">
        <div className="x-bfilters" role="group" aria-label="Helper state">
          {helperStates.map((s, i) => (
            <Fragment key={s.key}>
              {i > 0 && " "}
              <button
                className="x-bchip"
                type="button"
                aria-pressed={state === s.key}
                onClick={() => setState(s.key)}
              >
                {s.label}
              </button>
            </Fragment>
          ))}
        </div>
        <div className="x-bfilters" role="group" aria-label="Tiles">
          <button
            className="x-bchip"
            type="button"
            aria-pressed={look === "bright"}
            onClick={() => setLook("bright")}
          >
            Bright
          </button>{" "}
          <button
            className="x-bchip"
            type="button"
            aria-pressed={look === "ink"}
            onClick={() => setLook("ink")}
          >
            One colour
          </button>{" "}
          <button
            className="x-bchip"
            type="button"
            aria-pressed={look === "colour"}
            onClick={() => setLook("colour")}
          >
            Colour tiles
          </button>
        </div>
      </div>

      {/* the reveal script owns the list's classes, so the colour switch lives on a wrapper */}
      <div className={cx("x-bk-hset", look === "colour" && "is-colour", look === "bright" && "is-bright")}>
        <ul className="x-bk-helpers x-rv x-stag" aria-label="Mimi and her six helpers">
          <li className="x-bk-helper x-bk-helper--mimi">
            <div className="x-bk-helper__stage">
              <MimiHelperMark size={168} label="Mimi" />
            </div>
            <div className="x-bk-helper__meta">
              <div>
                <b>Mimi</b>
                <span className="x-mono">Routes your asks</span>
              </div>
              <p>The parent mark. She keeps her own mark, one colour on every tile.</p>
              <Downloads k="mimi" />
            </div>
          </li>
          {brandHelpers.map((h, i) => (
            <li
              key={h.key}
              className="x-bk-helper"
              style={look === "colour" ? ({ "--tile": helperColour[h.key] } as CSSProperties) : undefined}
            >
              <div className="x-bk-helper__stage">
                <Helper name={h.key} state={state} size={168} stagger={i} label={`${h.name}, ${state}`} />
              </div>
              <div className="x-bk-helper__meta">
                <div>
                  <b>{h.name}</b>
                  <span className="x-mono">{h.job}</span>
                </div>
                <p>
                  {h.cue} {h.move}
                </p>
                <Downloads k={h.key} />
              </div>
            </li>
          ))}
          <li className="x-bk-helper x-bk-helper--all">
            <div className="x-bk-helper__meta">
              <div>
                <b>The whole set</b>
              </div>
              <p>
                Every helper and Mimi as rigged SVG (all twelve eye layers inside) and 1024px PNG, on light
                and on dark, plus the colour tiles, the states and expressions sheets, the motion loop and the
                system PDF.
              </p>
              <div className="x-bk-dl x-bk-dl--stack">
                <a href={helpersZip.href} download className="x-mono">
                  ZIP {helpersZip.size} <span aria-hidden="true">↓</span>
                </a>
                <a href={helpersMotion.href} download className="x-mono">
                  Motion MP4 <span aria-hidden="true">↓</span>
                </a>
                <a href={helpersSystem.href} download className="x-mono">
                  System PDF <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <h3 className="x-bk-hh x-label">States</h3>
      <ol className="x-bk-states x-rv x-stag">
        {helperStates.map((s) => (
          <li key={s.key}>
            <div className="x-bk-states__row">
              {brandHelpers.map((h, i) => (
                <Helper key={h.key} name={h.key} state={s.key} size={56} stagger={i} />
              ))}
            </div>
            <b>{s.label}</b>
            <p>{s.note}</p>
          </li>
        ))}
      </ol>

      <h3 className="x-bk-hh x-label">Expressions</h3>
      <div className="x-bk-expr x-rv">
        <div className="x-bk-expr__stage">
          {brandHelpers.map((h, i) => (
            <Helper key={h.key} name={h.key} expression={expr} size={88} stagger={i} marks={false} />
          ))}
        </div>
        <div className="x-bfilters" role="group" aria-label="Expression">
          {helperExpressionLabels.map((e, i) => (
            <Fragment key={e}>
              {i > 0 && " "}
              <button className="x-bchip" type="button" aria-pressed={expr === e} onClick={() => setExpr(e)}>
                {e}
              </button>
            </Fragment>
          ))}
        </div>
        <p className="x-bk-expr__note">
          Twelve eye layers, shared by all six. Expressions change the mood; the orange mark changes the
          status.
        </p>
      </div>
    </>
  );
}

function Downloads({ k }: { k: string }) {
  return (
    <div className="x-bk-dl">
      {helperFiles(k).map((f) => (
        <a key={f.label} href={f.href} download className="x-mono">
          {f.label} <span aria-hidden="true">↓</span>
        </a>
      ))}
    </div>
  );
}
