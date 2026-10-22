import { useStore } from '../state/store';
import { ConditionIcon, DropletIcon, HomeIcon } from './icons';
import { formatTemperature, formatTime } from './format';
import type { KeyboardEvent } from 'react';
import type { Location } from '../types';

interface SidebarCardProps {
  location: Location;
  isHome: boolean;
}

export function SidebarCard({ location, isHome }: SidebarCardProps) {
  const { selectedId, select } = useStore();
  const isSelected = selectedId === location.id;
  const observed = formatTime(location.weather.observed_at);
  const area =
    location.weather.area || `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  const condition = location.weather.condition || '-';
  const temperature = formatTemperature(location.weather.temperature_c);
  const high = formatTemperature(location.weather.forecast_high_c);
  const low = formatTemperature(location.weather.forecast_low_c);
  const humidity = formatReading(location.weather.humidity_percent, 0, '%');
  const rainfall = formatReading(location.weather.rainfall_mm, 1, ' mm');

  const onSelect = () => select(location.id);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-pressed={isSelected}
      className={`relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left backdrop-blur-xl transition ${
        isSelected
          ? 'border-white/30 bg-white/20 shadow-lg shadow-black/20'
          : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold leading-tight text-white">{area}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
            {isHome ? (
              <>
                <span>My Location</span>
                <span className="text-white/40">·</span>
                <HomeIcon className="h-3 w-3" />
                <span>Home</span>
              </>
            ) : observed ? (
              <span>{observed}</span>
            ) : (
              <span className="text-white/50">Not refreshed</span>
            )}
          </div>
        </div>
        <div className="text-3xl font-light tabular-nums text-white/90">{temperature}</div>
      </div>
      <div className="mt-1 flex items-center gap-3 px-4 text-[11px] tabular-nums text-white/60">
        <span className="flex items-center gap-1" title="Relative humidity">
          <DropletIcon className="h-3 w-3" />
          {humidity}
        </span>
        <span title="Rainfall">Rain {rainfall}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-2 text-white/80">
          <ConditionIcon condition={location.weather.condition} className="h-4 w-4 shrink-0" />
          <span className="truncate">{condition}</span>
        </div>
        <div className="text-white/60 tabular-nums">
          H:{high} L:{low}
        </div>
      </div>
    </div>
  );
}

function formatReading(value: number | null | undefined, digits: number, unit: string): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(digits)}${unit}`
    : '--';
}
