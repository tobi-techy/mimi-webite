import { CalculatorEnhancer } from "@/features/marketing/forms/CalculatorEnhancer";
import { Section, Wrap } from "@/components/ui/Section";
import { Spaced } from "@/components/ui/Spaced";
import { Stickers } from "@/components/ui/Sticker";
import { Heading, Label, Lead } from "@/components/ui/Text";
import {
  assumptionNotes,
  calculatorFields,
  defaultPlan,
  estimateSavings,
  plans,
} from "@/features/marketing/content/pricing";
import { naira } from "@/lib/dom";

const defaults = estimateSavings({
  shops: calculatorFields[0].value,
  orders: calculatorFields[1].value,
  owed: calculatorFields[2].value,
  bad: calculatorFields[3].value,
  alerts: calculatorFields[4].value,
  leak: calculatorFields[5].value,
  plan: defaultPlan,
});

/** Money saved: estimate what Mimi stops leaking each month next to what it costs. */
export function PricingCalculator() {
  const rows = [
    { id: "oCollect", label: "Faster collections", value: defaults.collect },
    { id: "oBad", label: "Less bad debt", value: defaults.bad },
    { id: "oAlerts", label: "Fake alerts stopped", value: defaults.alerts },
    { id: "oLeak", label: "Less route leakage", value: defaults.leak },
  ];
  return (
    <Section tone="cream" clip id="calc">
      <Wrap grid>
        <div className="x-calc__head x-calc__head--stk x-rv">
          <Label>Money saved</Label>
          <Heading size="d2" reveal>
            What Mimi saves you every month.
          </Heading>
          <Lead style={{ marginTop: "20px" }}>
            Put in your numbers. See what stops leaking, next to what Mimi costs.
          </Lead>
        </div>{" "}
        <Stickers
          items={[{ src: "sticker-sugar", pos: "tr", w: 120, r: "-8deg", ox: "6%", oy: "-56px", lazy: true }]}
        />
        <form className="x-calc x-rv" id="calcForm">
          <Stickers
            items={[
              { src: "sticker-pos", pos: "bl", w: 120, r: "9deg", ox: "-26px", oy: "-40px", lazy: true },
            ]}
          />
          <div className="x-fields">
            <Spaced>
              {calculatorFields.map((f) => (
                <label key={f.id}>
                  <span className="x-label">{f.label}</span>
                  <input
                    type="number"
                    id={f.id}
                    defaultValue={f.value}
                    min={f.min}
                    step={f.step}
                    inputMode={f.inputMode}
                  />
                </label>
              ))}
              <label>
                <span className="x-label">Plan</span>
                <select id="cPlan" defaultValue={defaultPlan}>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </Spaced>
          </div>
          <div className="x-outs x-save" aria-live="polite">
            <div className="x-save__total">
              <span className="x-label">Saved a month</span>
              <output id="oSaved">{naira(defaults.saved)}</output>
            </div>
            <div>
              <dl className="x-save__rows">
                {rows.map((r) => (
                  <div key={r.id}>
                    <dt className="x-mono">{r.label}</dt>
                    <dd id={r.id}>{naira(r.value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="x-save__foot">
              <div>
                <span className="x-label">Mimi a month</span>
                <output id="oCost">{naira(defaults.cost)}</output>
              </div>
              <div>
                <span className="x-label">You keep</span>
                <output id="oNet" className="x-save__keep">
                  {naira(defaults.net)}
                </output>
              </div>
              <div>
                <span className="x-label" id="oMultLabel">
                  Pays for itself
                </span>
                <output id="oMult">{(Math.round(defaults.multiple * 10) / 10).toFixed(1)}x</output>
              </div>
            </div>
          </div>
          <p className="x-calc__note">
            Estimates based on what Mimi typically fixes: reminders that get paid sooner, alerts checked
            against your bank, route checks on every van. Your free pilot measures your real numbers.
          </p>
          <div className="x-save__more">
            <button
              type="button"
              className="x-save__toggle"
              id="calcWhyBtn"
              aria-expanded="false"
              aria-controls="calcWhy"
            >
              See the assumptions
            </button>{" "}
            <ul className="x-save__list" id="calcWhy" hidden>
              {assumptionNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </form>
      </Wrap>
      <CalculatorEnhancer />
    </Section>
  );
}
