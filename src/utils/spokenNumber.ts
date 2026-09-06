const ONES: Record<string, number> = {
  zero: 0,
  oh: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const SCALES: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
};

const FRACTIONS: Record<string, number> = {
  half: 0.5,
  quarter: 0.25,
  'a half': 0.5,
  'one half': 0.5,
};

export function parseSpokenNumber(input: string): number | null {
  const cleaned = input
    .toLowerCase()
    .replace(/,/g, '')
    .replace(/\bkilos?\b|\bkg\b|\bpounds?\b|\blbs?\b|\bgrams?\b|\bg\b|\bkcal\b|\bcalories\b|\breps?\b|\bminutes?\b|\bmins?\b/g, '')
    .replace(/\band\b/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return null;
  }

  const numeric = cleaned.match(/^(\d+(?:\.\d+)?)$/);
  if (numeric) {
    return Number(numeric[1]);
  }

  const mixed = cleaned.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (mixed && FRACTIONS[mixed[2]]) {
    return Number(mixed[1]) + FRACTIONS[mixed[2]];
  }

  if (FRACTIONS[cleaned] !== undefined) {
    return FRACTIONS[cleaned];
  }

  if (cleaned.includes('point')) {
    const [whole, frac] = cleaned.split('point');
    const wholeVal = wordsToNumber(whole.trim());
    const fracWords = frac.trim().split(' ').filter(Boolean);
    if (wholeVal === null || fracWords.length === 0) {
      return null;
    }
    const fracDigits = fracWords
      .map(word => (ONES[word] !== undefined ? String(ONES[word]) : word.match(/^\d$/) ? word : null))
      .filter((d): d is string => d !== null)
      .join('');
    if (!fracDigits) {
      return null;
    }
    return Number(`${wholeVal}.${fracDigits}`);
  }

  return wordsToNumber(cleaned);
}

function wordsToNumber(text: string): number | null {
  if (!text) {
    return null;
  }
  const direct = Number(text);
  if (!Number.isNaN(direct) && text.match(/^\d+(?:\.\d+)?$/)) {
    return direct;
  }
  const tokens = text.split(' ').filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }
  let total = 0;
  let current = 0;
  let consumed = false;
  for (const token of tokens) {
    if (ONES[token] !== undefined) {
      current += ONES[token];
      consumed = true;
    } else if (TENS[token] !== undefined) {
      current += TENS[token];
      consumed = true;
    } else if (SCALES[token] !== undefined) {
      current = (current || 1) * SCALES[token];
      if (SCALES[token] >= 1000) {
        total += current;
        current = 0;
      }
      consumed = true;
    } else if (token === 'a') {
      continue;
    } else {
      return null;
    }
  }
  if (!consumed) {
    return null;
  }
  return total + current;
}

export function extractFirstNumber(input: string): number | null {
  const spoken = parseSpokenNumber(input);
  if (spoken !== null) {
    return spoken;
  }
  const match = input.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}
