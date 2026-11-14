import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const SOURCE_PATH = new URL('../src/lib/evTripPlanning.ts', import.meta.url);

async function loadModule() {
  const source = await readFile(SOURCE_PATH, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`);
}

const vf5 = {
  key: 'vf5-current',
  family: 'VF5',
  displayName: 'VinFast VF5',
  trim: 'Plus',
  modelYear: null,
  batteryCapacityKwh: 37.23,
  rangeKm: 326,
  rangeStandard: 'NEDC',
  dcMaxKw: 50,
  fastCharge: '10–70%, khoảng 33 phút',
  sourceUrl: 'https://example.com',
  verifiedAt: '2026-11-14',
};

test('EV trip estimate doubles distance for a round trip and requires charging beyond usable range', async () => {
  const { estimateEvTrip } = await loadModule();
  const result = estimateEvTrip({
    spec: vf5,
    routeDistanceKm: 180,
    roundTrip: true,
    startSoc: 85,
    reserveSoc: 15,
    conditionFactor: 0.7,
    chargerKw: 120,
  });

  assert.equal(result.totalDistanceKm, 360);
  assert.equal(result.needsCharging, true);
  assert.ok(result.additionalEnergyKwh > 0);
  assert.ok(result.estimatedChargeMinutes > 8);
  assert.equal(result.expectedArrivalSoc, 15);
});

test('charging estimate is capped by the vehicle DC limit', async () => {
  const { estimateEvTrip } = await loadModule();
  const base = { spec: vf5, routeDistanceKm: 220, roundTrip: false, startSoc: 60, reserveSoc: 15, conditionFactor: 0.7 };
  const at60 = estimateEvTrip({ ...base, chargerKw: 60 });
  const at150 = estimateEvTrip({ ...base, chargerKw: 150 });

  assert.equal(at60.estimatedChargeMinutes, at150.estimatedChargeMinutes);
});

test('planner refuses to invent an estimate when the trim has no verified battery data', async () => {
  const { estimateEvTrip } = await loadModule();
  const result = estimateEvTrip({
    spec: { ...vf5, batteryCapacityKwh: null, rangeKm: null, dcMaxKw: null },
    routeDistanceKm: 100,
    roundTrip: false,
    startSoc: 85,
    reserveSoc: 15,
    conditionFactor: 0.7,
    chargerKw: 60,
  });

  assert.equal(result, null);
});
