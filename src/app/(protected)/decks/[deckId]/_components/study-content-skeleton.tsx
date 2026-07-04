export function StudyContentSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading study information">
      <div className="h-32 rounded-xl bg-default-100" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 rounded-xl bg-default-100" />
        <div className="h-56 rounded-xl bg-default-100" />
      </div>
      <div className="h-36 rounded-xl bg-default-100" />
    </div>
  );
}
