import { useState } from 'react';
import {
  MapPin, Phone, Mail, Calendar, Clock, Navigation,
  Trash2, Download, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import type { Property } from '../data/properties';

interface VisitItineraryProps {
  properties: Property[];
  onRemove: (id: string) => void;
}

const VISIT_DURATION = 45; // minutes per visit
const START_HOUR = 9;

function groupByCity(props: Property[]) {
  const groups: Record<string, Property[]> = {};
  for (const p of props) {
    if (!groups[p.city]) groups[p.city] = [];
    groups[p.city].push(p);
  }
  return groups;
}

function formatTime(minutesFromStart: number) {
  const totalMinutes = START_HOUR * 60 + minutesFromStart;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function formatPrice(p: Property) {
  if (p.transaction === 'Rent') return `${p.price.toLocaleString()} MAD/mo`;
  if (p.price >= 1_000_000) return `${(p.price / 1_000_000).toFixed(2)}M MAD`;
  return `${p.price.toLocaleString()} MAD`;
}

export default function VisitItinerary({ properties, onRemove }: VisitItineraryProps) {
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const cityGroups = groupByCity(properties);
  const cities = Object.keys(cityGroups);

  const handleDownload = () => {
    const lines: string[] = [];
    lines.push('=== REAL ESTATE VISIT ITINERARY ===');
    lines.push(`Visit Date: ${new Date(visitDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`);
    lines.push(`Total Properties: ${properties.length}`);
    lines.push('');

    let elapsed = 0;
    for (const city of cities) {
      lines.push(`--- ${city} ---`);
      for (const p of cityGroups[city]) {
        const start = formatTime(elapsed);
        const end = formatTime(elapsed + VISIT_DURATION);
        lines.push(`[${start} - ${end}] ${p.title}`);
        lines.push(`  Type: ${p.type} | ${p.bedrooms}BR/${p.bathrooms}BA | ${p.area}m²`);
        lines.push(`  Price: ${formatPrice(p)}`);
        lines.push(`  Address: ${p.address}`);
        lines.push(`  Phone: ${p.contactPhone}`);
        lines.push(`  Email: ${p.contactEmail}`);
        lines.push(`  Source: ${p.source} | ${p.listingUrl}`);
        if (notes[p.id]) lines.push(`  Notes: ${notes[p.id]}`);
        lines.push('');
        elapsed += VISIT_DURATION + 15; // 15 min travel
      }
    }
    lines.push(`Total estimated time: ${Math.round(elapsed / 60 * 10) / 10}h`);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visit-itinerary-${visitDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="text-4xl mb-3">🗓️</div>
        <div className="text-slate-600 font-medium mb-1">No properties selected</div>
        <div className="text-sm text-slate-400">Click the + icon on any property to add it to your visit list</div>
      </div>
    );
  }

  let elapsed = 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Visit Itinerary</h2>
            <div className="text-blue-100 text-xs mt-0.5">
              {properties.length} properties · {cities.length} {cities.length === 1 ? 'city' : 'cities'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" />
              <input
                type="date"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {cities.map(city => {
          const cityProps = cityGroups[city];
          const isExpanded = expandedCity === city || cities.length === 1;
          const cityStart = elapsed;
          const cityVisits = cityProps.length * VISIT_DURATION + (cityProps.length - 1) * 15;

          return (
            <div key={city} className="border border-slate-100 rounded-xl overflow-hidden">
              {/* City header */}
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                onClick={() => setExpandedCity(isExpanded && cities.length > 1 ? null : city)}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-orange-500" />
                  <span className="font-semibold text-slate-700">{city}</span>
                  <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-medium">
                    {cityProps.length} visit{cityProps.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(cityStart)} – {formatTime(cityStart + cityVisits)}
                  </span>
                  {cities.length > 1 && (
                    isExpanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="divide-y divide-slate-50">
                  {cityProps.map((p, i) => {
                    const visitStart = elapsed;
                    const visitEnd = elapsed + VISIT_DURATION;
                    elapsed += VISIT_DURATION + (i < cityProps.length - 1 ? 15 : 0);

                    return (
                      <div key={p.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {/* Time slot */}
                          <div className="shrink-0 text-center">
                            <div className="bg-blue-50 text-blue-600 rounded-lg px-2 py-1 text-xs font-mono font-bold w-16">
                              {formatTime(visitStart)}
                            </div>
                            <div className="text-slate-300 text-xs mt-0.5">to</div>
                            <div className="bg-slate-50 text-slate-500 rounded-lg px-2 py-1 text-xs font-mono w-16">
                              {formatTime(visitEnd)}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-slate-800 text-sm leading-tight">{p.title}</div>
                              <button
                                onClick={() => onRemove(p.id)}
                                className="shrink-0 p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                                title="Remove from itinerary"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Navigation size={10} />
                              {p.address}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                              <span className="font-semibold text-blue-600">{formatPrice(p)}</span>
                              <span>{p.area} m²</span>
                              {p.bedrooms > 0 && <span>{p.bedrooms} BR / {p.bathrooms} BA</span>}
                              <span className="text-slate-400">{p.type}</span>
                            </div>

                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                              <a href={`tel:${p.contactPhone}`} className="flex items-center gap-1 hover:text-blue-600">
                                <Phone size={11} /> {p.contactPhone}
                              </a>
                              <a href={`mailto:${p.contactEmail}`} className="flex items-center gap-1 hover:text-blue-600">
                                <Mail size={11} /> {p.contactEmail}
                              </a>
                              <a href={p.listingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                                <ExternalLink size={11} /> {p.source}
                              </a>
                            </div>

                            {/* Notes */}
                            <textarea
                              placeholder="Add visit notes..."
                              value={notes[p.id] || ''}
                              onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))}
                              rows={1}
                              className="mt-2 w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none text-slate-600 placeholder:text-slate-300"
                            />
                          </div>
                        </div>

                        {/* Travel time indicator between visits */}
                        {i < cityProps.length - 1 && (
                          <div className="ml-16 pl-3 mt-2 flex items-center gap-1.5 text-xs text-slate-300">
                            <Navigation size={10} />
                            <span>~15 min travel time</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Clock size={12} />
          Estimated total: ~{Math.round((properties.length * VISIT_DURATION + (properties.length - 1) * 15) / 60 * 10) / 10}h
          (45 min/visit + 15 min travel)
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={12} />
          {new Date(visitDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
