import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NewThreadRoute } from "@/features/console/components/chat/NewThreadRoute";
import { ThreadChat } from "@/features/console/components/chat/ThreadChat";
import { seedConversations } from "@/features/console/demo/seed";
import { TOUR_SLUG } from "@/features/console/demo/tour-state";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

/** Every sample thread (live demo threads and the migrated older ones) uses the same chat view. */
const all = seedConversations();

export function generateStaticParams() {
  /* the five-scene demo tour is a task of its own: its helper chats link to /threads/demo-tour */
  return [...all.map((c) => ({ slug: c.slug })), { slug: "new" }, { slug: TOUR_SLUG }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  if (slug === "new") return { title: "New thread" };
  if (slug === TOUR_SLUG) return { title: "Your morning with Mimi" };
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
  if (slug !== TOUR_SLUG && !all.some((c) => c.slug === slug)) notFound();
  return <ThreadChat slug={slug} />;
}
