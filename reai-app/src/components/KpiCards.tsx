import { Building2, TrendingUp, MapPin, Home, DollarSign, Clock } from 'lucide-react';
import type { Property } from '../data/properties';

interface KpiCardsProps {
  properties: Property[];
  filteredCount: number;
}

export default function KpiCards({ properties, filteredCount }: KpiCardsProps) {
  const saleProps = properties.filter(p => p.transaction === 'Sale');
  const rentProps = properties.filter(p => p.transaction === 'Rent');
  const available = properties.filter(p => p.status === 'Available').length;

  const avgSalePrice = saleProps.length
    ? Math.round(saleProps.reduce((s, p) => s + p.price, 0) / saleProps.length)
    : 0;
  const avgRentPrice = rentProps.length
    ? Math.round(rentProps.reduce((s, p) => s + p.price, 0) / rentProps.length)
    : 0;

  const cities = new Set(properties.map(p => p.city)).size;

  const recentCount = properties.filter(p => {
    const d = new Date(p.listed);
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  const cards = [
    {
      label: 'Total Properties',
      value: properties.length,
      sub: `${filteredCount} matching filters`,
      icon: Building2,
      color: 'bg-blue-500',
      light: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Avg. Sale Price',
      value: `${(avgSalePrice / 1000000).toFixed(2)}M MAD`,
      sub: `${saleProps.length} for sale`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      light: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Avg. Rent / Month',
      value: `${avgRentPrice.toLocaleString()} MAD`,
      sub: `${rentProps.length} rentals`,
      icon: TrendingUp,
      color: 'bg-violet-500',
      light: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Cities Covered',
      value: cities,
      sub: 'Across Morocco',
      icon: MapPin,
      color: 'bg-orange-500',
      light: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Available Now',
      value: available,
      sub: `${properties.length - available} under offer / taken`,
      icon: Home,
      color: 'bg-cyan-500',
      light: 'bg-cyan-50 text-cyan-600',
    },
    {
      label: 'New This Month',
      value: recentCount,
      sub: 'Listed in last 30 days',
      icon: Clock,
      color: 'bg-pink-500',
      light: 'bg-pink-50 text-pink-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.light}`}>
              <Icon size={18} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{card.value}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{card.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{card.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
