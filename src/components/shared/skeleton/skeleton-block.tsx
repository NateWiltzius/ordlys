import type { CSSProperties } from 'react';

type Props = {
  className?: string;
  style?: CSSProperties;
};

export default function SkeletonBlock({ className = '', style }: Props) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-default-200 bg-default-200/80 shadow-sm ${className}`}
      style={style}
    />
  );
}
