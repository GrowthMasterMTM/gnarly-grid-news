import Link from "next/link";

interface InsightCardProps {
  headline: string;
  summary: string;
  insightType: string;
  eventSlug?: string | null;
  eventTitle?: string | null;
}

export function InsightCard({
  headline,
  summary,
  insightType,
  eventSlug,
  eventTitle,
}: InsightCardProps) {
  const typeLabel = formatInsightType(insightType);

  const content = (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-amber-900/30 px-2 py-0.5 text-xs text-amber-400">
          {typeLabel}
        </span>
        {eventTitle && (
          <span className="text-xs text-neutral-500">{eventTitle}</span>
        )}
      </div>
      <p className="font-semibold text-white">{headline}</p>
      <p className="mt-1 text-sm text-neutral-400">{summary}</p>
    </div>
  );

  if (eventSlug) {
    return (
      <Link href={`/events/${eventSlug}`} className="block hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

function formatInsightType(type: string): string {
  switch (type) {
    case "event_winner":
      return "Winner";
    case "podium":
      return "Podium";
    case "event_recap":
      return "Recap";
    case "national_highlight":
      return "National";
    case "category_winner":
      return "Category";
    default:
      return type;
  }
}
