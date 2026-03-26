interface PageHeadingProps {
  title: string;
  description?: string;
}

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
      {description && (
        <p className="mt-2 text-neutral-400">{description}</p>
      )}
    </div>
  );
}
