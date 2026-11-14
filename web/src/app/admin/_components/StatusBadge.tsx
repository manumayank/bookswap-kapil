import { enumLabel, statusBadgeClass } from './labels';

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge whitespace-nowrap ${statusBadgeClass(status)}`}>{enumLabel(status)}</span>;
}
