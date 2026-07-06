import { parse } from 'csv-parse/sync';
import { CONTENT_LIMITS } from '@/lib/validation/content';

const REQUIRED_HEADERS = ['front', 'back'] as const;
const SUPPORTED_HEADERS = new Set([
  ...REQUIRED_HEADERS,
  'lesson',
  'reading',
  'front_alternatives',
  'back_alternatives',
]);

export const CSV_IMPORT_LIMITS = {
  fileBytes: 2 * 1024 * 1024,
  rows: 5000,
} as const;

export type ImportedVocab = {
  front: string;
  back: string;
  lesson: string;
  reading: string | null;
  frontAlternatives: string[];
  backAlternatives: string[];
};

type CsvRecord = Record<string, string>;

export function parseDeckCsv(contents: string): ImportedVocab[] {
  let headers: string[] = [];
  let records: CsvRecord[];

  try {
    records = parse(contents, {
      bom: true,
      columns: rawHeaders => {
        headers = rawHeaders.map(normalizeHeader);
        return headers;
      },
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The CSV could not be parsed.';
    throw new Error(`Invalid CSV: ${message}`);
  }

  const duplicateHeader = headers.find((header, index) => headers.indexOf(header) !== index);
  if (duplicateHeader) throw new Error(`The CSV contains the header “${duplicateHeader}” twice.`);

  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required))
      throw new Error(`The CSV is missing the “${required}” header.`);
  }

  const unsupported = headers.filter(header => !SUPPORTED_HEADERS.has(header));
  if (unsupported.length) {
    throw new Error(
      `Unsupported CSV header: ${unsupported.map(header => `“${header}”`).join(', ')}.`,
    );
  }
  if (!records.length) throw new Error('The CSV does not contain any vocabulary rows.');
  if (records.length > CSV_IMPORT_LIMITS.rows) {
    throw new Error(`A CSV can contain at most ${CSV_IMPORT_LIMITS.rows} vocabulary rows.`);
  }

  return records.map((record, index) => parseRecord(record, index + 2));
}

function parseRecord(record: CsvRecord, rowNumber: number): ImportedVocab {
  const front = requiredCell(record.front, 'front', rowNumber);
  const back = requiredCell(record.back, 'back', rowNumber);
  const lesson = optionalCell(record.lesson, 'lesson', rowNumber, CONTENT_LIMITS.lessonTitle);
  const reading = optionalCell(record.reading, 'reading', rowNumber, CONTENT_LIMITS.vocabText);

  return {
    front,
    back,
    lesson: lesson ?? 'Imported vocabulary',
    reading,
    frontAlternatives: parseAlternatives(
      record.front_alternatives,
      'front_alternatives',
      rowNumber,
    ),
    backAlternatives: parseAlternatives(record.back_alternatives, 'back_alternatives', rowNumber),
  };
}

function requiredCell(value: string | undefined, column: string, row: number): string {
  const text = value?.trim();
  if (!text) throw new Error(`Row ${row}: “${column}” is required.`);
  if (text.length > CONTENT_LIMITS.vocabText) {
    throw new Error(
      `Row ${row}: “${column}” must be ${CONTENT_LIMITS.vocabText} characters or fewer.`,
    );
  }
  return text;
}

function optionalCell(
  value: string | undefined,
  column: string,
  row: number,
  maxLength: number,
): string | null {
  const text = value?.trim();
  if (!text) return null;
  if (text.length > maxLength) {
    throw new Error(`Row ${row}: “${column}” must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function parseAlternatives(value: string | undefined, column: string, row: number): string[] {
  if (!value?.trim()) return [];
  const alternatives = value
    .split('|')
    .map(alternative => alternative.trim())
    .filter(Boolean);

  if (alternatives.length > CONTENT_LIMITS.alternatives) {
    throw new Error(
      `Row ${row}: “${column}” can contain at most ${CONTENT_LIMITS.alternatives} alternatives.`,
    );
  }
  const tooLong = alternatives.find(alternative => alternative.length > CONTENT_LIMITS.vocabText);
  if (tooLong) {
    throw new Error(
      `Row ${row}: each “${column}” value must be ${CONTENT_LIMITS.vocabText} characters or fewer.`,
    );
  }
  return alternatives;
}

function normalizeHeader(header: unknown): string {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}
