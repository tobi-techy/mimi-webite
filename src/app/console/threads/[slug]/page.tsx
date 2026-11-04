import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NewThreadRoute } from "@/features/console/components/chat/NewThreadRoute";
import { ThreadChat } from "@/features/console/components/chat/ThreadChat";
import { seedConversations } from "@/features/console/demo/seed";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

/** Every sample thread (live demo threads and the migrated older ones) uses the same chat view. */
const all = seedConversations();

export function generateStaticParams() {
  return [...all.map((c) => ({ slug: c.slug })), { slug: "new" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  if (slug === "new") return { title: "New thread" };
  return { title: all.find((c) => c.slug === slug)?.title ?? "Thread" };
}

export default async function ThreadPage({ params }: Props) {
  const slug = (await params).slug;
  if (slug === "new")
    return (
      <Suspense fallback={null}>
        <NewThreadRoute />
      </Suspense>
    );
  if (!all.some((c) => c.slug === slug)) notFound();
  return <ThreadChat slug={slug} />;
}
