type Props = {
  label: string;
  language?: string | null;
  value: string;
  reading?: string | null;
  alternatives?: string[];
  primary?: boolean;
};

export default function WordSide({
  label,
  language,
  value,
  reading,
  alternatives = [],
  primary = false,
}: Props) {
  return (
    <section
      className={
        primary
          ? 'pb-7 text-center sm:pb-9'
          : 'border-t border-default-200 pt-7 text-center sm:pt-9'
      }
    >
      <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
        <p className="text-xs font-semibold uppercase text-default-500">{label}</p>
        {language ? (
          <>
            <span className="text-default-300" aria-hidden="true">
              ·
            </span>
            <p className="text-xs text-default-500">{language}</p>
          </>
        ) : null}
      </div>
      <p
        className={
          primary
            ? 'mt-3 break-words text-4xl leading-tight font-semibold sm:text-5xl'
            : 'mt-3 break-words text-2xl leading-snug font-medium sm:text-3xl'
        }
      >
        {value}
      </p>
      {reading ? (
        <p className="mt-2 break-words text-sm text-default-500">
          <span className="font-medium text-default-600">Reading:</span> {reading}
        </p>
      ) : null}
      {alternatives.length > 0 ? (
        <p className="mt-3 break-words text-sm text-default-500">
          <span className="font-medium text-default-600">Also accepted:</span>{' '}
          {alternatives.join(' · ')}
        </p>
      ) : null}
    </section>
  );
}
