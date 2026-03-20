import { X, MapPin, Bed, Bath, Maximize2, Phone, Mail, ExternalLink, Calendar, Tag } from 'lucide-react';
import type { Property } from '../data/properties';
import SourceBadge from './SourceBadge';
import StatusBadge from './StatusBadge';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
}

export default function PropertyDetailModal({ property: p, onClose }: PropertyDetailModalProps) {
  const formatPrice = (prop: Property) => {
    if (prop.transaction === 'Rent') return `${prop.price.toLocaleString()} MAD/mois`;
    if (prop.price >= 1_000_000) return `${(prop.price / 1_000_000).toFixed(2)}M MAD`;
    return `${prop.price.toLocaleString()} MAD`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-slate-800 text-lg leading-tight">{p.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <SourceBadge source={p.source} />
              <StatusBadge status={p.status} />
              <span className="text-xs text-slate-400">{p.type} · {p.transaction}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Price */}
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-xl p-4 mb-4">
            <div className="text-2xl font-bold text-slate-800">{formatPrice(p)}</div>
            {p.transaction === 'Sale' && (
              <div className="text-sm text-slate-500 mt-0.5">{p.pricePerSqm.toLocaleString()} MAD/m²</div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <Maximize2 size={16} className="mx-auto text-slate-400 mb-1" />
              <div className="font-bold text-slate-700">{p.area} m²</div>
              <div className="text-xs text-slate-400">Surface</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <Bed size={16} className="mx-auto text-slate-400 mb-1" />
              <div className="font-bold text-slate-700">{p.bedrooms || '—'}</div>
              <div className="text-xs text-slate-400">Chambres</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <Bath size={16} className="mx-auto text-slate-400 mb-1" />
              <div className="font-bold text-slate-700">{p.bathrooms || '—'}</div>
              <div className="text-xs text-slate-400">Salles de bain</div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 mb-3 p-3 bg-slate-50 rounded-xl">
            <MapPin size={15} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-slate-700">{p.neighborhood}, {p.city}</div>
              <div className="text-xs text-slate-400">{p.address}</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 mb-4">{p.description}</p>

          {/* Features */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Tag size={11} /> Features
            </div>
            <div className="flex flex-wrap gap-1.5">
              {p.features.map(f => (
                <span key={f} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Listed */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
            <Calendar size={12} />
            Listed: {new Date(p.listed).toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>

          {/* Contact */}
          <div className="border-t border-slate-100 pt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Contact</div>
            <div className="flex flex-col gap-2">
              <a href={`tel:${p.contactPhone}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600">
                <Phone size={14} className="text-slate-400" />
                {p.contactPhone}
              </a>
              <a href={`mailto:${p.contactEmail}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600">
                <Mail size={14} className="text-slate-400" />
                {p.contactEmail}
              </a>
              <a
                href={p.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink size={14} />
                View on {p.source}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
