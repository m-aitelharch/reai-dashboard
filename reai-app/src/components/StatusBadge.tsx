import type { Status } from '../data/properties';

const statusColors: Record<Status, string> = {
  Available: 'bg-emerald-100 text-emerald-700',
  'Under Offer': 'bg-amber-100 text-amber-700',
  Sold: 'bg-slate-100 text-slate-500',
  Rented: 'bg-slate-100 text-slate-500',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status]}`}>
      {status}
    </span>
  );
}
