import { type StudyTone } from '@/lib/study-colors';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { buttonVariants } from '@heroui/react';

type Props = {
  title: string;
  description: string;
  tone: StudyTone;
  exitHref: string;
  exitLabel: string;
};

export default function StudySessionHeader({
  title,
  description,
  tone,
  exitHref,
  exitLabel,
}: Props) {
  return (
    <header
      data-study-tone={tone}
      className="flex items-start justify-between gap-4 border-b border-default-200 pb-5"
    >
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-default-500">{description}</p>
      </div>
      <a
        href={exitHref}
        className={buttonVariants({
          variant: 'tertiary',
          size: 'sm',
          className: 'shrink-0 whitespace-nowrap',
        })}
      >
        <ArrowLeftIcon className="size-4" aria-hidden="true" />
        {exitLabel}
      </a>
    </header>
  );
}
