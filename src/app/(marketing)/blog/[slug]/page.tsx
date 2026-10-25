import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/features/marketing/blog/BlogCard";
import { PostMeta } from "@/features/marketing/blog/PostMeta";
import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { PostCta } from "@/features/marketing/sections/post/PostCta";
import { JsonLd } from "@/components/ui/JsonLd";
import { Photo, photoOgImage } from "@/components/ui/Photo";
import { getPost, morePosts, posts } from "@/features/marketing/content/posts";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/config/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return pageMetadata({
    absoluteTitle: `${post.title} · ${site.name} Blog`,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.date,
    authors: [post.author],
    image: { ...photoOgImage(post.image.src), alt: post.image.alt },
  });
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const url = absoluteUrl(`/blog/${post.slug}`);

  return (
    <RouteView route="post">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            dateModified: post.date,
            author: { "@type": "Person", name: post.author },
            publisher: { "@id": absoluteUrl("/#organization") },
            image: absoluteUrl(photoOgImage(post.image.src).url),
            articleSection: post.tag,
            mainEntityOfPage: url,
            url,
          },
        ]}
      />
      <article className="x-post">
        <div className="x-wrap">
          <header className="x-post__col x-post__head">
            <Link className="x-tlink x-txtlink" href="/blog">
              ← All posts
            </Link>{" "}
            <p className="x-label" id="postTag">
              {post.tag}
            </p>
            <h1 className="x-d2 x-hl" id="postTitle">
              {post.title}
            </h1>
            <p className="x-label x-bmeta" id="postMeta">
              {post.author} · <PostMeta post={post} />
            </p>
          </header>
          <figure className="x-post__img" id="postImg">
            <Photo photo={post.image} sizes="(min-width: 1320px) 1320px, 100vw" priority />
          </figure>
          <div className="x-post__col x-post__body" id="postBody">
            {post.body}
          </div>
        </div>
      </article>
      <PostCta />
      <section className="x-sec x-sec--tight" aria-labelledby="moreH">
        <div className="x-wrap">
          <div className="x-bhead">
            <h2 className="x-label" id="moreH">
              More posts
            </h2>
            <Link className="x-tlink x-txtlink" href="/blog">
              All posts <span className="x-arr">→</span>
            </Link>
          </div>
          <div className="x-bgrid x-bgrid--2" id="postMore">
            {morePosts(post).map((p) => (
              <BlogCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </section>
    </RouteView>
  );
}
