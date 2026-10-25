import Link from "next/link";
import { Fragment } from "react";
import { Photo } from "@/components/ui/Photo";
import { Section, Wrap } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Sticker } from "@/components/ui/Sticker";
import { paths } from "@/features/marketing/content/home";

/** 01 / Choose your path: one card per audience. */
export function HomePaths() {
  return (
    <Section>
      <Wrap>
        <SectionHeader
          label="01 / Choose your path"
          title="One shared shop book. Three ways in."
          note="Pick your lane. We handle the rest."
        />
        <div className="x-paths">
          {paths.map((p, i) => (
            <Fragment key={p.href}>
              {i > 0 && " "}
              <Link className="x-path x-rv" href={p.href}>
                {" "}
                <div className="x-path__img x-ph">
                  <Photo photo={p.photo} sizes="(min-width: 900px) 33vw, 100vw" />
                </div>{" "}
                <Sticker {...p.sticker} />{" "}
                <div className="x-path__meta x-label">
                  <span>{p.meta}</span>
                  <span className="x-arr">→</span>
                </div>
                <h3>{p.title}</h3>{" "}
              </Link>
            </Fragment>
          ))}
        </div>
      </Wrap>
    </Section>
  );
}
