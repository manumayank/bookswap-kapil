import prisma from './prisma';

const COUNTER_NAME = 'deal_code';

/**
 * Atomically increment the deal counter and format a human-readable code.
 * Format: SY-<year>-<6-digit-zero-padded-sequence>, e.g. SY-2026-000142.
 */
export async function nextDealCode(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: COUNTER_NAME },
    update: { value: { increment: 1 } },
    create: { name: COUNTER_NAME, value: 1 },
  });
  const year = new Date().getFullYear();
  const seq = String(counter.value).padStart(6, '0');
  return `SY-${year}-${seq}`;
}
