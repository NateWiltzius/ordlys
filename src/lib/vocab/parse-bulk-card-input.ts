import { CONTENT_LIMITS } from '@/lib/validation/content';

export const MAX_BULK_CARDS = 100;

export type BulkCardInput = {
  front: string;
  back: string;
  reading: string | null;
};

export type BulkCardPreviewRow = BulkCardInput & {
  lineNumber: number;
  errors: string[];
  warnings: string[];
};

export type BulkCardParseResult = {
  rows: BulkCardPreviewRow[];
  cards: BulkCardInput[];
  errorCount: number;
  warningCount: number;
  batchError: string | null;
};

type ExistingCard = Pick<BulkCardInput, 'front' | 'back'>;

export function parseBulkCardInput(
  value: string,
  existingCards: ExistingCard[] = [],
): BulkCardParseResult {
  const lines = value.split(/\r?\n/);
  const nonBlankLines = lines
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.split('\t').some(cell => cell.trim()));

  if (isHeader(nonBlankLines[0]?.line)) nonBlankLines.shift();

  const existingKeys = new Set(existingCards.map(cardKey));
  const batchKeys = new Set<string>();
  const rows = nonBlankLines.map(({ line, lineNumber }) => {
    const cells = line.split('\t');
    while (cells.length > 0 && !cells.at(-1)?.trim()) cells.pop();

    const front = cells[0]?.trim() ?? '';
    const back = cells[1]?.trim() ?? '';
    const reading = cells[2]?.trim() || null;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (cells.length < 2) errors.push('Separate the front and back with a tab.');
    if (cells.length > 3) errors.push('Use at most three columns: front, back, and reading.');
    if (!front) errors.push('Front is required.');
    if (!back) errors.push('Back is required.');
    if (front.length > CONTENT_LIMITS.vocabText) {
      errors.push(`Front must be ${CONTENT_LIMITS.vocabText} characters or fewer.`);
    }
    if (back.length > CONTENT_LIMITS.vocabText) {
      errors.push(`Back must be ${CONTENT_LIMITS.vocabText} characters or fewer.`);
    }
    if (reading && reading.length > CONTENT_LIMITS.vocabText) {
      errors.push(`Reading must be ${CONTENT_LIMITS.vocabText} characters or fewer.`);
    }

    if (front && back) {
      const key = cardKey({ front, back });
      if (batchKeys.has(key)) warnings.push('Duplicate within this batch.');
      else if (existingKeys.has(key)) warnings.push('Already exists in this lesson.');
      batchKeys.add(key);
    }

    return { lineNumber, front, back, reading, errors, warnings };
  });

  const batchError =
    rows.length > MAX_BULK_CARDS
      ? `Paste at most ${MAX_BULK_CARDS} cards at a time. This batch contains ${rows.length}.`
      : null;
  const errorCount = rows.reduce((total, row) => total + row.errors.length, 0);
  const warningCount = rows.reduce((total, row) => total + row.warnings.length, 0);

  return {
    rows,
    cards:
      batchError || errorCount > 0
        ? []
        : rows.map(({ front, back, reading }) => ({ front, back, reading })),
    errorCount,
    warningCount,
    batchError,
  };
}

function isHeader(line: string | undefined) {
  if (!line) return false;
  const cells = line.split('\t').map(cell => normalizedKey(cell));
  return cells[0] === 'front' && cells[1] === 'back' && (!cells[2] || cells[2] === 'reading');
}

function cardKey(card: ExistingCard) {
  return `${normalizedKey(card.front)}\u0000${normalizedKey(card.back)}`;
}

function normalizedKey(value: string) {
  return value.trim().normalize('NFKC').toLowerCase();
}
