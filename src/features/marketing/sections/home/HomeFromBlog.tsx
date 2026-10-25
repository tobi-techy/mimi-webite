import { BlogFeature } from "@/features/marketing/blog/BlogFeature";
import { TextLink } from "@/components/ui/Button";
import { Section, Wrap } from "@/components/ui/Section";
import { posts } from "@/features/marketing/content/posts";

/** From the blog: the newest post. */
export function HomeFromBlog() {
  const latest = posts[0];
  return (
    <Section className="x-bstrip" id="from-blog" aria-labelledby="fromBlogH">
      <Wrap>
        <div className="x-bhead">
          <h2 className="x-label" id="fromBlogH">
            From the blog
          </h2>
          <TextLink href="/blog" arrow>
            All posts
          </TextLink>
        </div>
        <div id="blogLatest">{latest && <BlogFeature post={latest} small />}</div>
      </Wrap>
    </Section>
  );
}
