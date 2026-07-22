import { Children, ReactNode } from 'react';

type Props = {
  label: string;
  value: string;
  alternatives: string[];
  children?: ReactNode;
};

export default function VocabSide({ label, value, alternatives, children }: Props) {
  const visibleChildren = Children.toArray(children);

  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted sm:hidden">
        {label}
      </p>

      <p className="break-words text-sm font-medium text-foreground">{value}</p>

      {alternatives.length > 0 ? (
        <p className="mt-1 break-words text-xs leading-relaxed text-muted">
          <span className="font-medium">Also accepts:</span> {alternatives.join(', ')}
        </p>
      ) : null}

      {visibleChildren.length > 0 ? <div className="mt-1">{visibleChildren}</div> : null}
    </div>
  );
}
