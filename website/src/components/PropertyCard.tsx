import { ScoredProperty } from "@/lib/scoring";

interface PropertyCardProps {
  property: ScoredProperty;
  rank: number;
}

export default function PropertyCard({ property, rank }: PropertyCardProps) {
  const yieldPercent = ((property.rent_estimate * 52) / property.price * 100).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-7 h-7 bg-primary-100 text-primary-700 rounded-full text-sm font-bold">
              {rank}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              {property.address}
            </h3>
          </div>
          <p className="text-gray-500 text-sm">{property.suburb}, VIC</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">
            ${property.price.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            ${property.rent_estimate}/week rent
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
          <p className="text-sm font-medium text-gray-900">
            {property.property_type}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Beds</p>
          <p className="text-sm font-medium text-gray-900">
            {property.bedrooms}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Land</p>
          <p className="text-sm font-medium text-gray-900">
            {property.land_size}m&sup2;
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Yield</p>
          <p className="text-sm font-medium text-gray-900">{yieldPercent}%</p>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2">
        <ScoreBar label="Growth" value={property.growth_score} max={10} color="bg-green-500" />
        <ScoreBar label="Yield" value={property.yield_score} max={10} color="bg-blue-500" />
        <ScoreBar label="Risk" value={property.risk_score} max={10} color="bg-red-400" />
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">Final Score</span>
        <span className="text-lg font-bold text-primary-600">
          {property.final_score.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-12">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
