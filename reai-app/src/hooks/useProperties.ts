import { useState, useEffect } from 'react';
import type { Property } from '../data/properties';
import seedData from '../data/seed-properties.json';

interface PropertiesData {
  updatedAt: string;
  count: number;
  properties: Property[];
}

const seed = seedData as PropertiesData;

export function useProperties() {
  const [data, setData] = useState<PropertiesData>(seed);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('./properties.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((live: PropertiesData) => {
        if (live?.properties?.length) {
          setData(live);
        }
      })
      .catch(err => {
        console.warn('Could not load live properties, using seed data:', err.message);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return { properties: data.properties, updatedAt: data.updatedAt, loading, error };
}
