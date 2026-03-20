import type { Source } from '../data/properties';

const sourceColors: Record<Source, string> = {
  Yakeey: 'bg-blue-100 text-blue-700',
  Mubawab: 'bg-orange-100 text-orange-700',
  Avito: 'bg-green-100 text-green-700',
  Sarouty: 'bg-purple-100 text-purple-700',
  'Seloger Maroc': 'bg-red-100 text-red-700',
};

export default function SourceBadge({ source }: { source: Source }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${sourceColors[source]}`}>
      {source}
    </span>
  );
}
