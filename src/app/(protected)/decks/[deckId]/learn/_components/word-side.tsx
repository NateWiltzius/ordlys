type Props = {
  label: string;
  language?: string | null;
  value: string;
  reading?: string | null;
  alternatives?: string[];
  emphasis?: boolean;
};

export default function WordSide({
  label,
  language,
  value,
  reading,
  alternatives = [],
  emphasis = false,
}: Props) {
  return (
    <section
      className={`rounded-xl border px-4 py-5 ${
        emphasis ? 'border-blue-500/30 bg-blue-500/10' : 'border-default-200 bg-default-50'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-default-500">{label}</p>
        {language ? <p className="text-xs text-default-500">{language}</p> : null}
      </div>
      <p className="mt-2 break-words text-2xl font-semibold">{value}</p>
      {reading ? (
        <p className="mt-1 break-words text-sm text-default-500">
          <span className="font-medium">Reading:</span> {reading}
        </p>
      ) : null}
      {alternatives.length > 0 ? (
        <p className="mt-3 break-words text-sm text-default-500">
          <span className="font-medium">Also accepted:</span> {alternatives.join(' · ')}
        </p>
      ) : null}
    </section>
  );
}
