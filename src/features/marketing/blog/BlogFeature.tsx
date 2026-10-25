import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { PostMeta } from "@/features/marketing/blog/PostMeta";
import { W } from "@/components/ui/Words";
import type { Post } from "@/features/marketing/content/posts";
import { cx } from "@/lib/cx";

type BlogFeatureProps = {
  post: Post;
  /** Compact version for the home page strip (h3 instead of h2). */
  small?: boolean;
  /**
   * First render of the page: the excerpt reveals on its own and the headline rises word by word.
   * Cards re-rendered by the tag filter reveal as one block instead (as on the original site).
   */
  initial?: boolean;
};

/** The featured (newest) post: large image beside title, excerpt and date. */
export function BlogFeature({ post, small, initial = true }: BlogFeatureProps) {
  const splitTitle = initial && !small;
  return (
    <Link className={cx("x-bfeat", small && "x-bfeat--sm", !initial && "x-rv")} href={`/blog/${post.slug}`}>
      <div className="x-bfeat__img">
        <Photo photo={post.image} sizes="(min-width: 900px) 50vw, 100vw" />
      </div>
      <div className="x-bfeat__txt">
        <p className="x-label">{post.tag}</p>
        {small ? (
          <h3 className="x-d3">{post.title}</h3>
        ) : (
          <h2 className={cx("x-d2", splitTitle && "x-hl")}>
            {splitTitle ? <W>{post.title}</W> : post.title}
          </h2>
        )}
        <p className={cx("x-lead", initial && "x-rv")}>{post.excerpt}</p>
        <p className="x-label x-bmeta">
          <PostMeta post={post} />
        </p>
      </div>
    </Link>
  );
}
