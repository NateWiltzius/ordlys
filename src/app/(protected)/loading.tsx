export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading page">
      <div className="h-28 rounded-xl bg-default-100" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-xl bg-default-100" />
        <div className="h-20 rounded-xl bg-default-100" />
        <div className="h-20 rounded-xl bg-default-100" />
      </div>
      <div className="h-52 rounded-xl bg-default-100" />
    </div>
  );
}
