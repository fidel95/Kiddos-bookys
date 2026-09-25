import { notFound } from "next/navigation";
import { STORIES, getStory } from "@/data/stories";
import StoryReader from "@/components/StoryReader";

export const dynamicParams = false;

export function generateStaticParams() {
  return STORIES.map((story) => ({ id: story.id }));
}

export default async function StoryPage({ params }: PageProps<"/story/[id]">) {
  const { id } = await params;
  const story = getStory(id);
  if (!story) notFound();
  return <StoryReader key={story.id} story={story} />;
}
