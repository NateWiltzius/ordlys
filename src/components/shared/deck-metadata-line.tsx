type Props = {
  rows: string[][];
  className?: string;
};

export default function DeckMetadataLine({ rows, className = '' }: Props) {
  const visibleRows = rows.map(row => row.filter(Boolean)).filter(row => row.length > 0);
  if (visibleRows.length === 0) return null;

  return (
    <div className={`space-y-1 text-sm text-default-500 ${className}`}>
      {visibleRows.map((row, rowIndex) => (
        <p key={rowIndex} className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {row.map((item, itemIndex) => (
            <span key={`${item}-${itemIndex}`} className="flex items-center gap-2">
              {itemIndex > 0 ? (
                <span className="text-default-300" aria-hidden="true">
                  &middot;
                </span>
              ) : null}
              <span>{item}</span>
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}
