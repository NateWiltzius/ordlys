import type { CSSProperties } from 'react';

type Props = {
  className?: string;
  style?: CSSProperties;
};

export default function SkeletonBlock({ className = '', style }: Props) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-default-200 bg-default-200/80 ${className}`}
      style={style}
    />
  );
}
