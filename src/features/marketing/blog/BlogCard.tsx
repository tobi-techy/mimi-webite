import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { PostMeta } from "@/features/marketing/blog/PostMeta";
import type { Post } from "@/features/marketing/content/posts";
import { cx } from "@/lib/cx";

/** A post card in the blog grid and the "More posts" row. `scaleIn` keeps the photo's slight zoom. */
export function BlogCard({ post, scaleIn }: { post: Post; scaleIn?: boolean }) {
  return (
    <Link className="x-path x-bcard x-rv" href={`/blog/${post.slug}`}>
      <div className={cx("x-path__img", scaleIn && "x-ph")}>
        <Photo photo={post.image} sizes="(min-width: 900px) 33vw, 100vw" />
      </div>
      <div className="x-path__meta x-label">
        <span>{post.tag}</span>
        <span className="x-arr">→</span>
      </div>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <p className="x-label x-bmeta">
        <PostMeta post={post} />
      </p>
    </Link>
  );
}
