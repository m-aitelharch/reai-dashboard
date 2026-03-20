import { useState, useMemo } from 'react';
import { Building2, ListChecks, RefreshCw } from 'lucide-react';
import { useProperties } from './hooks/useProperties';
import type { Property } from './data/properties';
import KpiCards from './components/KpiCards';
import FilterPanel, { defaultFilters } from './components/FilterPanel';
import type { Filters } from './components/FilterPanel';
import PropertyTable from './components/PropertyTable';
import VisitItinerary from './components/VisitItinerary';
import PropertyDetailModal from './components/PropertyDetailModal';

function applyFilters(props: Property[], f: Filters): Property[] {
  return props.filter(p => {
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = `${p.title} ${p.city} ${p.neighborhood} ${p.address} ${p.type}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.transaction !== 'All' && p.transaction !== f.transaction) return false;
    if (f.types.length > 0 && !f.types.includes(p.type)) return false;
    if (f.cities.length > 0 && !f.cities.includes(p.city)) return false;
    if (f.sources.length > 0 && !f.sources.includes(p.source)) return false;
    if (f.status !== 'All' && p.status !== f.status) return false;
    if (f.minPrice !== '' && p.price < Number(f.minPrice)) return false;
    if (f.maxPrice !== '' && p.price > Number(f.maxPrice)) return false;
    if (f.minBedrooms !== '' && p.bedrooms < Number(f.minBedrooms)) return false;
    if (f.minArea !== '' && p.area < Number(f.minArea)) return false;
    return true;
  });
}

type Tab = 'properties' | 'itinerary';

export default function App() {
  const { properties, updatedAt, loading } = useProperties();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);

  const filtered = useMemo(() => applyFilters(properties, filters), [filters, properties]);
  const selectedProperties = useMemo(
    () => properties.filter(p => selectedIds.has(p.id)),
    [selectedIds, properties]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center">
              <Building2 size={17} className="text-white" />
            </div>
            <span className="font-bold text-slate-800 text-lg">ReAI</span>
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">Morocco</span>
            {loading
              ? <span className="text-xs text-slate-400 flex items-center gap-1"><RefreshCw size={11} className="animate-spin" /> Refreshing…</span>
              : updatedAt && <span className="text-xs text-slate-400 hidden sm:block">Updated {new Date(updatedAt).toLocaleString('fr-MA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            }
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'properties'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 size={15} />
              Properties
            </button>
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'itinerary'
                  ? 'bg-blue-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ListChecks size={15} />
              Visit List
              {selectedIds.size > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === 'itinerary' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                }`}>
                  {selectedIds.size}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {/* KPI Cards always visible */}
        <KpiCards properties={properties} filteredCount={filtered.length} />

        {activeTab === 'properties' && (
          <>
            <FilterPanel filters={filters} onChange={setFilters} />
            <PropertyTable
              properties={filtered}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onViewDetail={p => setDetailProperty(p)}
            />
          </>
        )}

        {activeTab === 'itinerary' && (
          <VisitItinerary
            properties={selectedProperties}
            onRemove={id => setSelectedIds(prev => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            })}
          />
        )}
      </main>

      {detailProperty && (
        <PropertyDetailModal
          property={detailProperty}
          onClose={() => setDetailProperty(null)}
        />
      )}
    </div>
  );
}
