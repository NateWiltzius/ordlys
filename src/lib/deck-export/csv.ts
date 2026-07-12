type DeckExportRow = {
  front: string;
  back: string;
  lesson: string;
  reading: string | null;
  frontAlternatives: string[];
  backAlternatives: string[];
  frontToBackQuizHint: string | null;
  backToFrontQuizHint: string | null;
  tags: string[];
  metadata: unknown;
  notes: string | null;
};

const HEADERS = [
  'front',
  'back',
  'lesson',
  'reading',
  'front_alternatives',
  'back_alternatives',
  'front_to_back_quiz_hint',
  'back_to_front_quiz_hint',
  'tags',
  'metadata',
  'notes',
] as const;

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildDeckCsv(rows: DeckExportRow[]): string {
  const body = rows.map(row =>
    [
      row.front,
      row.back,
      row.lesson,
      row.reading,
      row.frontAlternatives.join('|'),
      row.backAlternatives.join('|'),
      row.frontToBackQuizHint,
      row.backToFrontQuizHint,
      row.tags.join('|'),
      Object.keys(row.metadata ?? {}).length ? JSON.stringify(row.metadata) : '',
      row.notes,
    ]
      .map(csvCell)
      .join(','),
  );

  return `\uFEFF${[HEADERS.join(','), ...body].join('\r\n')}\r\n`;
}

export function downloadFilename(title: string, extension: 'csv' | 'json'): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
  return `${slug || 'ordlys-export'}.${extension}`;
}
