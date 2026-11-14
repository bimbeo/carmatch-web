import type { EvVehicleSpec } from '@/data/evVehicleSpecs';

export interface EvTripEstimate {
  totalDistanceKm: number;
  conservativeRangeKm: number;
  usableRangeKm: number;
  needsCharging: boolean;
  energyNeededKwh: number;
  additionalEnergyKwh: number;
  estimatedChargeMinutes: number | null;
  expectedArrivalSoc: number;
}

export function estimateEvTrip({
  spec,
  routeDistanceKm,
  roundTrip,
  startSoc,
  reserveSoc,
  conditionFactor,
  chargerKw,
}: {
  spec: EvVehicleSpec;
  routeDistanceKm: number;
  roundTrip: boolean;
  startSoc: number;
  reserveSoc: number;
  conditionFactor: number;
  chargerKw: number;
}): EvTripEstimate | null {
  if (!spec.rangeKm || !spec.batteryCapacityKwh || !spec.dcMaxKw || routeDistanceKm <= 0) return null;

  const totalDistanceKm = routeDistanceKm * (roundTrip ? 2 : 1);
  const safeConditionFactor = Math.min(0.9, Math.max(0.55, conditionFactor));
  const conservativeRangeKm = spec.rangeKm * safeConditionFactor;
  const usableSoc = Math.max(0, Math.min(100, startSoc) - Math.max(0, Math.min(50, reserveSoc)));
  const usableRangeKm = conservativeRangeKm * (usableSoc / 100);
  const energyPerKm = spec.batteryCapacityKwh / conservativeRangeKm;
  const energyNeededKwh = totalDistanceKm * energyPerKm;
  const availableEnergyKwh = spec.batteryCapacityKwh * (usableSoc / 100);
  const additionalEnergyKwh = Math.max(0, energyNeededKwh - availableEnergyKwh);
  const effectiveKw = Math.min(Math.max(1, chargerKw), spec.dcMaxKw) * 0.62;
  const estimatedChargeMinutes = additionalEnergyKwh > 0
    ? Math.ceil((additionalEnergyKwh / effectiveKw) * 60 + 8)
    : 0;

  return {
    totalDistanceKm,
    conservativeRangeKm: Math.round(conservativeRangeKm),
    usableRangeKm: Math.round(usableRangeKm),
    needsCharging: totalDistanceKm > usableRangeKm,
    energyNeededKwh: Math.round(energyNeededKwh * 10) / 10,
    additionalEnergyKwh: Math.round(additionalEnergyKwh * 10) / 10,
    estimatedChargeMinutes,
    expectedArrivalSoc: Math.round(Math.max(reserveSoc, startSoc - (totalDistanceKm / conservativeRangeKm) * 100)),
  };
}
