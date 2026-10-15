import Image from "next/image";

import { Lab } from "./Tile";

const FLOW = [
  { text: "Stock book read, 42 items", time: "7:02 AM" },
  { text: "Indomie Chicken running low, 6 cartons left", time: "7:05 AM" },
  { text: "₦48,500 transfer checked: real", time: "7:41 AM" },
  { text: "Restock request sent to distributor", time: "7:44 AM", grey: true },
  { text: "Done, all synced", time: "7:45 AM", grey: true },
];

const CHAT = [
  { me: true, text: "Abeg check this alert, ₦48,500 from Tunde" },
  { me: false, text: "I checked. The money landed in your account at 7:41. It's real." },
  {
    me: false,
    text: "Also, Indomie Chicken will finish by Friday. Want me to ask Femi Distributors for 10 cartons?",
  },
  { me: true, text: "Yes o" },
];

/** The one piece of UI in the site: the hero's WhatsApp-style mock. */
export function ChatPanel() {
  return (
    <div className="relative overflow-hidden rounded-sheet bg-tint">
      <Image
        src="/images/hero.jpg"
        alt="Etching of a Nigerian market street"
        width={1800}
        height={957}
        priority
        sizes="(max-width: 1500px) 100vw, 1400px"
        className="h-[clamp(340px,46vw,560px)] w-full object-cover [filter:saturate(0.5)_contrast(1.02)] max-[760px]:h-[300px]"
      />
      <div className="absolute inset-0 bg-[rgba(17,17,17,0.14)] max-[760px]:hidden" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 z-[2] grid items-end gap-4 p-[clamp(14px,2.4vw,30px)] text-left min-[1000px]:grid-cols-2 max-[760px]:static max-[760px]:pt-3">
        <div className="rounded-sheet bg-paper p-[18px] shadow-[0_16px_34px_rgba(17,17,17,0.16)]">
          <Lab>Today</Lab>
          <p className="mt-2 text-xl font-medium tracking-[-0.03em]">Today at Mama Ade Stores</p>
          <ul className="mt-3.5 grid list-none gap-[11px] p-0">
            {FLOW.map((item) => (
              <li
                key={item.text}
                className="grid grid-cols-[10px_1fr_auto] items-center gap-2.5 text-sm text-soft"
              >
                <i className={`h-2 w-2 rounded-full ${item.grey ? "bg-faint-2" : "bg-ink"}`} />
                <span>{item.text}</span>
                <time className="font-mono text-xs text-muted">{item.time}</time>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-sheet bg-paper p-[18px] shadow-[0_16px_34px_rgba(17,17,17,0.16)]">
          <Lab>Mimi</Lab>
          <div className="mt-3 grid gap-2">
            {CHAT.map((bubble) => (
              <p
                key={bubble.text}
                className={
                  bubble.me
                    ? "ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-sm leading-[1.4] text-surface"
                    : "max-w-[88%] rounded-2xl rounded-bl-md bg-tint px-3.5 py-2.5 text-sm leading-[1.4] text-soft"
                }
              >
                {bubble.text}
              </p>
            ))}
          </div>
          <p className="mt-3 flex justify-between rounded-full border border-hairline px-4 py-3 text-[13px] text-muted">
            <span>Message Mimi</span>
            <span aria-hidden="true">→</span>
          </p>
        </div>
      </div>
    </div>
  );
}
