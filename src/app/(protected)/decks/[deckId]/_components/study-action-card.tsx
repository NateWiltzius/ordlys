import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { buttonVariants, Card } from '@heroui/react';
import Link from 'next/link';
import { ComponentType, ReactNode, SVGProps } from 'react';
import { STUDY_TONE_STYLES, StudyTone } from '@/lib/study-colors';

type ActionTone = StudyTone;

type Props = {
  title: string;
  description: ReactNode;
  count: number;
  countLabel: string;
  actionLabel: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: ActionTone;
  href?: string;
  onAction?: () => void;
  unavailableAction?: ReactNode;
  isDisabled?: boolean;
};

const TONE_CARD_STYLES: Record<ActionTone, { gradient: string; hover: string; focus: string }> = {
  learning: {
    gradient: 'from-blue-500/15 via-blue-500/5 to-transparent',
    hover: 'group-hover:border-blue-500/50',
    focus: 'focus-visible:ring-blue-500',
  },
  review: {
    gradient: 'from-success/15 via-success/5 to-transparent',
    hover: 'group-hover:border-success/50',
    focus: 'focus-visible:ring-success',
  },
  neutral: {
    gradient: 'from-primary/10 via-primary/5 to-transparent',
    hover: 'group-hover:border-primary/40',
    focus: 'focus-visible:ring-primary',
  },
};

export default function StudyActionCard({
  title,
  description,
  count,
  countLabel,
  actionLabel,
  icon: Icon,
  tone,
  href,
  onAction,
  unavailableAction,
  isDisabled = false,
}: Props) {
  const toneStyles = STUDY_TONE_STYLES[tone];
  const cardStyles = TONE_CARD_STYLES[tone];

  const card = (
    <Card
      className={`h-full overflow-hidden border transition duration-200 ${
        isDisabled
          ? 'border-default-200 bg-default-50'
          : `bg-gradient-to-br ${toneStyles.surface} ${cardStyles.gradient} ${cardStyles.hover}`
      }`}
    >
      <Card.Header className="flex-row items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm ${
            isDisabled ? 'bg-default-100 text-default-400' : toneStyles.accent
          }`}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <Card.Title className="text-lg">{title}</Card.Title>
          <Card.Description>{description}</Card.Description>
        </div>
      </Card.Header>

      <Card.Content className="flex items-baseline gap-2">
        <p
          className={`text-4xl font-bold tracking-tight ${
            isDisabled ? 'text-default-400' : toneStyles.text
          }`}
        >
          {count}
        </p>
        <p className="font-medium text-default-600">{countLabel}</p>
      </Card.Content>

      <Card.Footer>
        {href ? (
          <span
            className={buttonVariants({
              variant: 'primary',
              size: 'lg',
              className: `w-full shadow-sm ${toneStyles.button}`,
            })}
          >
            {actionLabel}
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        ) : onAction ? (
          <button
            type="button"
            className={buttonVariants({
              variant: 'primary',
              size: 'lg',
              className: `w-full shadow-sm ${toneStyles.button}`,
            })}
            onClick={onAction}
          >
            {actionLabel}
            <ArrowRightIcon
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        ) : (
          unavailableAction
        )}
      </Card.Footer>
    </Card>
  );

  return href ? (
    <Link
      href={href}
      className={`group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${cardStyles.focus}`}
    >
      {card}
    </Link>
  ) : (
    <div className="group h-full">{card}</div>
  );
}
