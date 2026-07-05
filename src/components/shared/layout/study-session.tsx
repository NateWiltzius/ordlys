import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  className?: string;
}>;

export default function StudySession({ children, className = '' }: Props) {
  return <div className={`mx-auto w-full md:max-w-xl ${className}`}>{children}</div>;
}
