import { X } from 'lucide-react';
import type { PropertyType, TransactionType, Source, City, Status } from '../data/properties';
import { SOURCES, CITIES, PROPERTY_TYPES } from '../data/properties';

export interface Filters {
  search: string;
  transaction: TransactionType | 'All';
  types: PropertyType[];
  cities: City[];
  sources: Source[];
  status: Status | 'All';
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  minArea: string;
}

export const defaultFilters: Filters = {
  search: '',
  transaction: 'All',
  types: [],
  cities: [],
  sources: [],
  status: 'All',
  minPrice: '',
  maxPrice: '',
  minBedrooms: '',
  minArea: '',
};

interface FilterPanelProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const activeCount = [
    filters.transaction !== 'All',
    filters.types.length > 0,
    filters.cities.length > 0,
    filters.sources.length > 0,
    filters.status !== 'All',
    filters.minPrice !== '',
    filters.maxPrice !== '',
    filters.minBedrooms !== '',
    filters.minArea !== '',
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
      {/* Search + clear */}
      <div className="flex gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by title, neighborhood, city, address..."
          value={filters.search}
          onChange={e => set({ search: e.target.value })}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {activeCount > 0 && (
          <button
            onClick={() => onChange(defaultFilters)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg px-3 py-2"
          >
            <X size={12} /> Clear ({activeCount})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Transaction */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Transaction</label>
          <div className="flex gap-2">
            {(['All', 'Sale', 'Rent'] as const).map(t => (
              <button
                key={t}
                onClick={() => set({ transaction: t })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filters.transaction === t
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Status</label>
          <select
            value={filters.status}
            onChange={e => set({ status: e.target.value as Status | 'All' })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Under Offer">Under Offer</option>
            <option value="Sold">Sold</option>
            <option value="Rented">Rented</option>
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Min Price (MAD)</label>
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice}
            onChange={e => set({ minPrice: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Max Price (MAD)</label>
          <input
            type="number"
            placeholder="No limit"
            value={filters.maxPrice}
            onChange={e => set({ maxPrice: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Min Bedrooms */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Min Bedrooms</label>
          <select
            value={filters.minBedrooms}
            onChange={e => set({ minBedrooms: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}+</option>
            ))}
          </select>
        </div>

        {/* Min Area */}
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Min Area (m²)</label>
          <input
            type="number"
            placeholder="Any"
            value={filters.minArea}
            onChange={e => set({ minArea: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Property Types */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Property Type</label>
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_TYPES.map(t => (
              <button
                key={t}
                onClick={() => set({ types: toggle(filters.types, t) })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  filters.types.includes(t)
                    ? 'bg-violet-500 text-white border-violet-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cities */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">City</label>
          <div className="flex flex-wrap gap-1.5">
            {CITIES.map(c => (
              <button
                key={c}
                onClick={() => set({ cities: toggle(filters.cities, c) })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  filters.cities.includes(c)
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Source</label>
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map(s => (
              <button
                key={s}
                onClick={() => set({ sources: toggle(filters.sources, s) })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  filters.sources.includes(s)
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
