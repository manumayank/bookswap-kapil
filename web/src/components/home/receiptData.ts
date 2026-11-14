// Sample "reuse receipt" for a class: illustrative figures, not live data.
// Shared by the SVG billing machine and the three.js one so both print the same bill.

export const SUBJECTS = ['English', 'Maths', 'Science', 'Social studies', 'Hindi'];

export type ReceiptItem = { name: string; mrp: number; reuse: number };

export type Receipt = {
  cls: number;
  boardLabel: string;
  items: ReceiptItem[];
  totalNew: number;
  totalReuse: number;
  saved: number;
  pct: number;
};

export function sampleSet(cls: number): ReceiptItem[] {
  const base = 150 + cls * 26;
  return SUBJECTS.map((name, i) => {
    const mrp = Math.round((base + i * 24) / 10) * 10;
    const reuse = Math.round((mrp * 0.44) / 10) * 10;
    return { name, mrp, reuse };
  });
}

export function receiptFor(cls: number, boardLabel: string): Receipt {
  const items = sampleSet(cls);
  const totalNew = items.reduce((a, b) => a + b.mrp, 0);
  const totalReuse = items.reduce((a, b) => a + b.reuse, 0);
  const saved = totalNew - totalReuse;
  return { cls, boardLabel, items, totalNew, totalReuse, saved, pct: Math.round((saved / totalNew) * 100) };
}

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
