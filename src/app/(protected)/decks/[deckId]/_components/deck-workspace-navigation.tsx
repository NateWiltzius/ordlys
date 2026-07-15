import Link from 'next/link';

export type DeckWorkspaceSection = 'overview' | 'lessons' | 'publishing';

type Props = {
  deckId: number;
  activeSection: DeckWorkspaceSection;
  showOwnerSections: boolean;
};

export default function DeckWorkspaceNavigation({
  deckId,
  activeSection,
  showOwnerSections,
}: Props) {
  if (!showOwnerSections) return null;

  const items = [
    { id: 'overview' as const, label: 'Overview', href: `/decks/${deckId}` },
    { id: 'lessons' as const, label: 'Lessons', href: `/decks/${deckId}/edit` },
    {
      id: 'publishing' as const,
      label: 'Publishing',
      href: `/decks/${deckId}/edit?section=publishing`,
    },
  ];

  return (
    <nav
      aria-label="Deck workspace"
      className="grid grid-cols-3 gap-1 rounded-xl border border-default-200 bg-default-50 p-1"
    >
      {items.map(item => {
        const isActive = activeSection === item.id;

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-lg px-3 py-2 text-center text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? 'bg-background text-primary shadow-sm'
                : 'text-default-600 hover:bg-background/70 hover:text-default-900'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
