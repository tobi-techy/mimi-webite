"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { BlogCard } from "@/features/marketing/blog/BlogCard";
import { BlogFeature } from "@/features/marketing/blog/BlogFeature";
import { rearmReveal } from "@/features/marketing/motion/rearm";
import { POST_TAGS, posts, type PostTag } from "@/features/marketing/content/posts";

type Filter = "All" | PostTag;
const FILTERS: Filter[] = ["All", ...POST_TAGS];

/** Tag chips and the post list: the newest matching post is featured, the rest form a grid. */
export function BlogList() {
  const [tag, setTag] = useState<Filter>("All");
  // every click re-renders the list from scratch so the cards animate in again
  const [generation, setGeneration] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const initial = generation === 0;

  useEffect(() => {
    if (generation > 0) rearmReveal(listRef.current);
  }, [generation]);

  const shown = posts.filter((p) => tag === "All" || p.tag === tag);
  const [first, ...rest] = shown;

  return (
    <>
      <div className="x-bfilters" role="group" aria-label="Filter posts by tag">
        {FILTERS.map((f, i) => (
          <Fragment key={f}>
            {i > 0 && " "}
            <button
              className="x-bchip"
              type="button"
              data-tag={f}
              aria-pressed={f === tag}
              onClick={() => {
                setTag(f);
                setGeneration((g) => g + 1);
              }}
            >
              {f}
            </button>
          </Fragment>
        ))}
      </div>
      <div id="blogList" aria-live="polite" ref={listRef}>
        {first ? (
          <>
            <BlogFeature key={`${generation}-${first.slug}`} post={first} initial={initial} />
            {rest.length > 0 && (
              <div className="x-bgrid" key={`${generation}-grid`}>
                {rest.map((p) => (
                  <BlogCard key={p.slug} post={p} scaleIn={initial} />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="x-bempty">No posts with this tag yet.</p>
        )}
      </div>
    </>
  );
}
