import { useState } from 'react';
import {
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink,
  Bed, Bath, Maximize2, PlusCircle, CheckCircle, Eye,
} from 'lucide-react';
import type { Property } from '../data/properties';
import SourceBadge from './SourceBadge';
import StatusBadge from './StatusBadge';

type SortKey = 'price' | 'area' | 'bedrooms' | 'listed' | 'pricePerSqm';
type SortDir = 'asc' | 'desc';

interface PropertyTableProps {
  properties: Property[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onViewDetail: (p: Property) => void;
}

export default function PropertyTable({
  properties, selectedIds, onToggleSelect, onViewDetail,
}: PropertyTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('listed');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const perPage = 10;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const sorted = [...properties].sort((a, b) => {
    let va: number | string = a[sortKey];
    let vb: number | string = b[sortKey];
    if (sortKey === 'listed') {
      va = new Date(a.listed).getTime();
      vb = new Date(b.listed).getTime();
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice(page * perPage, (page + 1) * perPage);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={13} className="text-slate-300" />;
    return sortDir === 'asc'
      ? <ArrowUp size={13} className="text-blue-500" />
      : <ArrowDown size={13} className="text-blue-500" />;
  };

  const formatPrice = (p: Property) => {
    if (p.transaction === 'Rent') return `${p.price.toLocaleString()} MAD/mo`;
    if (p.price >= 1_000_000) return `${(p.price / 1_000_000).toFixed(2)}M MAD`;
    return `${p.price.toLocaleString()} MAD`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {properties.length} {properties.length === 1 ? 'property' : 'properties'} found
        </span>
        {selectedIds.size > 0 && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
            {selectedIds.size} selected for visit list
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <th className="w-10 px-3 py-3 text-center">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-3 py-3 text-left">Property</th>
              <th className="px-3 py-3 text-left">Location</th>
              <th
                className="px-3 py-3 text-right cursor-pointer select-none hover:text-blue-600 whitespace-nowrap"
                onClick={() => handleSort('price')}
              >
                <span className="inline-flex items-center gap-1">Price <SortIcon col="price" /></span>
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer select-none hover:text-blue-600 whitespace-nowrap"
                onClick={() => handleSort('pricePerSqm')}
              >
                <span className="inline-flex items-center gap-1">MAD/m² <SortIcon col="pricePerSqm" /></span>
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer select-none hover:text-blue-600 whitespace-nowrap"
                onClick={() => handleSort('area')}
              >
                <span className="inline-flex items-center gap-1">Area <SortIcon col="area" /></span>
              </th>
              <th
                className="px-3 py-3 text-center cursor-pointer select-none hover:text-blue-600"
                onClick={() => handleSort('bedrooms')}
              >
                <span className="inline-flex items-center gap-1">Beds <SortIcon col="bedrooms" /></span>
              </th>
              <th className="px-3 py-3 text-center">Source</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th
                className="px-3 py-3 text-center cursor-pointer select-none hover:text-blue-600"
                onClick={() => handleSort('listed')}
              >
                <span className="inline-flex items-center gap-1">Listed <SortIcon col="listed" /></span>
              </th>
              <th className="px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paged.map(p => {
              const selected = selectedIds.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50 transition-colors ${selected ? 'bg-blue-50/40' : ''}`}
                >
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => onToggleSelect(p.id)}
                      className={`transition-colors ${selected ? 'text-blue-500' : 'text-slate-300 hover:text-blue-400'}`}
                      title={selected ? 'Remove from visit list' : 'Add to visit list'}
                    >
                      {selected ? <CheckCircle size={18} /> : <PlusCircle size={18} />}
                    </button>
                  </td>
                  <td className="px-3 py-3 max-w-xs">
                    <div className="font-medium text-slate-800 line-clamp-1">{p.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {p.type} · {p.transaction}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-slate-700">{p.city}</div>
                    <div className="text-xs text-slate-400">{p.neighborhood}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">
                    {formatPrice(p)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500 text-xs whitespace-nowrap">
                    {p.transaction === 'Sale' ? `${p.pricePerSqm.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-600 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 size={12} className="text-slate-400" />
                      {p.area} m²
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">
                    {p.bedrooms > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Bed size={12} className="text-slate-400" />
                        {p.bedrooms}
                        <Bath size={12} className="text-slate-400 ml-1" />
                        {p.bathrooms}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <SourceBadge source={p.source} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-3 text-center text-xs text-slate-400 whitespace-nowrap">
                    {new Date(p.listed).toLocaleDateString('fr-MA', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewDetail(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      <a
                        href={p.listingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                        title="View on source website"
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500 text-xs">
            Page {page + 1} of {totalPages} ({properties.length} results)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const idx = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
              return (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                    idx === page
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
