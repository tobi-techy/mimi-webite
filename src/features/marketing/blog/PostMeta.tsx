import { formatPostDate, type Post } from "@/features/marketing/content/posts";

/** "21 Oct 2026 · 4 min read" */
export function PostMeta({ post }: { post: Post }) {
  return (
    <>
      <time dateTime={post.date}>{formatPostDate(post.date)}</time> · {post.readMins} min read
    </>
  );
}
