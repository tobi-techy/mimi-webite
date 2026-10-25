"use client";

import Link from "next/link";
import { useState } from "react";
import { Sticker } from "@/components/ui/Sticker";
import {
  formatPlanNaira,
  plans,
  yearlyMonthsFree,
  yearlyPerShop,
  yearlySaving,
  yearlyTotal,
  usageExtras,
  type Billing,
} from "@/features/marketing/content/pricing";
import { cx } from "@/lib/cx";
import { sfx } from "@/lib/sound";

export function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const yearly = billing === "yearly";
  return (
    <section className="x-plans-sec" style={{ paddingBottom: "clamp(64px,8vw,120px)" }}>
      <div className="x-wrap">
        <Sticker src="sticker-pin" pos="bl" w={110} r="8deg" ox="12%" lazy />{" "}
        <div className="x-bill" role="radiogroup" aria-label="Billing period">
          {(["monthly", "yearly"] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={billing === b}
              className={cx("x-bill__opt", billing === b && "is-on")}
              onClick={() => {
                if (b !== billing) sfx("billing", "select", { direction: b === "yearly" ? "forward" : "back" });
                setBilling(b);
              }}
            >
              {b === "monthly" ? "Monthly" : "Yearly"}
              {b === "yearly" && (
                <span className="x-bill__save">
                  {yearlyMonthsFree === 1 ? "1 month free" : `${yearlyMonthsFree} months free`}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="x-plans">
          {plans.map((plan) => (
            <article key={plan.id} className={cx("x-plan", plan.popular && "x-plan--pop", "x-rv")}>
              {plan.popular && (
                <>
                  <Sticker src="sticker-stamp" pos="in" w={110} r="12deg" ox="-14px" oy="-40px" lazy />{" "}
                </>
              )}
              <p className="x-mono">
                {plan.name}
                {plan.popular && (
                  <>
                    {" "}
                    <span className="x-plan__tag">Most popular</span>
                  </>
                )}
              </p>
              <p className="x-plan__price" aria-live="polite">
                {yearly && <s className="x-plan__was">{formatPlanNaira(plan.perShop)}</s>}
                {formatPlanNaira(yearly ? yearlyPerShop(plan) : plan.perShop)}
                <span>/shop a month</span>
              </p>
              <p className="x-plan__min">
                {yearly ? (
                  <>
                    {formatPlanNaira(yearlyTotal(plan))} billed yearly. You save{" "}
                    {formatPlanNaira(yearlySaving(plan))}.
                  </>
                ) : (
                  <>Minimum {formatPlanNaira(plan.monthlyMinimum)} a month</>
                )}
              </p>
              <ul>
                {plan.includes && <li className="x-plan__inc">{plan.includes}</li>}
                {plan.features.map((f) =>
                  typeof f === "string" ? (
                    <li key={f}>{f}</li>
                  ) : (
                    <li key={f.text}>
                      {f.text}
                      {f.soon && <span className="x-plan__tag">Coming soon</span>}
                    </li>
                  ),
                )}
              </ul>{" "}
              {plan.popular ? (
                <Link className="x-btn x-btn--o" href="/contact">
                  Book a pilot <span className="x-arr">→</span>
                </Link>
              ) : (
                <Link className="x-btn x-btn--ghost" href="/contact">
                  Book a pilot
                </Link>
              )}
            </article>
          ))}
        </div>
        <article className="x-addon x-rv">
          <div className="x-addon__head">
            <p className="x-mono">Pay as you use</p>
            <p className="x-plan__min">On either plan. You only pay for what you use.</p>
          </div>
          <ul className="x-addon__list">
            {usageExtras.map((it) => (
              <li key={it.title} className="x-addon__usage">
                <b>
                  {it.title}
                  {"soon" in it && it.soon && <span className="x-plan__tag">Coming soon</span>}
                </b>
                <span className="x-mono">{it.price}</span>
                <p>{it.body}</p>
              </li>
            ))}
          </ul>
        </article>
        <div className="x-extras x-rv x-stag">
          <div style={{ "--si": "0" }}>
            <span className="x-mono">Brands</span>
            <p>
              Priced separately. Start by <Link href="/contact">sponsoring a pilot</Link>.
            </p>
          </div>
          <div style={{ "--si": "1" }}>
            <span className="x-mono">Shops</span>
            <p>Always free.</p>
          </div>
          <div style={{ "--si": "2" }}>
            <span className="x-mono">Yearly</span>
            <p>Covers your minimum. Shops above it are billed monthly at the yearly rate.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
