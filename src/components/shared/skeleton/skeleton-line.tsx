import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';

type Props = {
  className?: string;
};

export default function SkeletonLine({ className = 'h-4 w-full' }: Props) {
  return <SkeletonBlock className={`rounded-md ${className}`} />;
}
