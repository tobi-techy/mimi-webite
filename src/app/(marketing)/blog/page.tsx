import { BlogList } from "@/features/marketing/blog/BlogList";
import { RouteView } from "@/features/marketing/components/layout/RouteView";
import { JsonLd } from "@/components/ui/JsonLd";
import { W } from "@/components/ui/Words";
import { posts } from "@/features/marketing/content/posts";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl, site } from "@/config/site";

export const metadata = pageMetadata({
  title: "Blog: FMCG distribution in Nigeria",
  description:
    "Notes from the route. What we are learning about collections, credit, fake alerts and sell-through, building Mimi with distributors, brands and shops in Nigeria.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <RouteView route="blog">
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Blog", path: "/blog" }]),
          {
            "@context": "https://schema.org",
            "@type": "Blog",
            name: `${site.name} Blog`,
            url: absoluteUrl("/blog"),
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: absoluteUrl(`/blog/${p.slug}`),
              datePublished: p.date,
            })),
          },
        ]}
      />
      <section className="x-sec">
        <div className="x-wrap">
          <div className="x-sechead">
            <p className="x-label">Blog</p>
            <h1 className="x-d1 x-hl">
              <W>Notes from the route.</W>
            </h1>
            <p className="x-lead x-rv">
              What we're learning building Mimi with distributors, brands and shops in Nigeria.
            </p>
          </div>
          <BlogList />
        </div>
      </section>
    </RouteView>
  );
}
