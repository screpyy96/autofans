import { useEffect, useRef, useState } from 'react';
import type { Car } from '~/types';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '~/components/ui/Button';
import { MapPin, X } from 'lucide-react';

const CITY_CENTERS: Record<string, [number, number]> = {
  bucuresti: [26.1025, 44.4268], clujnapoca: [23.5947, 46.7712], iasi: [27.6014, 47.1585],
  timisoara: [21.2087, 45.7489], constanta: [28.6348, 44.1598], brasov: [25.6012, 45.6579],
};
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function MapResults({ cars, onCarClick }: { cars: Car[]; onCarClick: (car: Car) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const onCarClickRef = useRef(onCarClick);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  useEffect(() => {
    onCarClickRef.current = onCarClick;
  }, [onCarClick]);

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!token || !containerRef.current || mapRef.current) return;
    let disposed = false;
    void import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (disposed || !containerRef.current) return;
      const map = new mapboxgl.Map({ accessToken: token, container: containerRef.current, style: 'mapbox://styles/mapbox/standard', center: [25.0, 45.9], zoom: 5.7 });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      cars.forEach((car) => {
        const point = CITY_CENTERS[normalize(car.location.city)];
        if (!point) return;
        const marker = new mapboxgl.Marker({ color: '#f4c542' })
          .setLngLat(point)
          .addTo(map);
        marker.getElement().setAttribute('aria-label', `Arată ${car.title} pe hartă`);
        marker.getElement().addEventListener('click', () => setSelectedCar(car));
      });
      mapRef.current = map;
    });
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [cars]);

  if (!import.meta.env.VITE_MAPBOX_TOKEN) return null;
  return (
    <div className="relative mb-6 h-[360px] overflow-hidden rounded-2xl border border-white/10" aria-label="Hartă cu anunțuri">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/15 bg-secondary-950/90 px-3 py-2 text-xs text-white shadow-lg backdrop-blur">
        Apasă un pin galben pentru a vedea mașina
      </div>
      {selectedCar && (
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/15 bg-secondary-950/95 p-4 shadow-2xl backdrop-blur sm:left-auto sm:w-80">
          <button onClick={() => setSelectedCar(null)} className="absolute right-3 top-3 text-gray-400 hover:text-white" aria-label="Închide cardul mașinii"><X className="h-4 w-4" /></button>
          <div className="pr-6">
            <p className="font-semibold text-white">{selectedCar.title}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-400"><MapPin className="h-3.5 w-3.5 text-accent-gold" />{selectedCar.location.city}</p>
          </div>
          <Button onClick={() => onCarClickRef.current(selectedCar)} className="mt-4 w-full bg-gold-gradient text-secondary-900">Vezi anunțul</Button>
        </div>
      )}
    </div>
  );
}
