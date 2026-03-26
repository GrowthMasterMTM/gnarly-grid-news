import Link from "next/link";

interface EventCardProps {
  title: string;
  slug: string;
  championship: string;
  discipline: string;
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  status: string;
}

export function EventCard({
  title,
  slug,
  championship,
  discipline,
  location,
  startDate,
  endDate,
  status,
}: EventCardProps) {
  const dateStr = formatEventDate(startDate, endDate);
  const isUpcoming = status === "upcoming";
  const isOngoing = status === "ongoing";

  return (
    <Link
      href={`/events/${slug}`}
      className="group flex items-start gap-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700"
    >
      <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-neutral-800 text-center">
        <span className="text-xs font-bold uppercase text-neutral-400">
          {startDate.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="text-lg font-bold text-white">
          {startDate.getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-white group-hover:text-neutral-200">
          {title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-300">
            {championship}
          </span>
          <span className="capitalize">{discipline}</span>
          {location && <span>{location}</span>}
          <span>{dateStr}</span>
          {(isUpcoming || isOngoing) && (
            <span
              className={`rounded-full px-1.5 py-0.5 ${
                isOngoing
                  ? "bg-green-900/30 text-green-400"
                  : "bg-blue-900/30 text-blue-400"
              }`}
            >
              {status}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function formatEventDate(start: Date, end: Date | null): string {
  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (!end || end.getTime() === start.getTime()) return startStr;
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${startStr} – ${endStr}`;
}
