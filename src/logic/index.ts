// This file contains the bulk of the logic, which can be set up without relying on the DOM.

import { accelerations, engines, type Engine, type EngineName } from './engineData';

const avg = (arr: readonly Engine[], f: (arg: Engine) => number) => {
  return arr.reduce((prev, el) => prev + f(el) / arr.length, 0);
};

const sum = (arr: readonly Engine[], f: (arg: Engine) => number) => {
  return arr.reduce((prev, el) => prev + f(el), 0);
};

const gcd = (args: readonly number[]) => args.reduce((a, b) => {
  while (b) [a, b] = [b, a % b];
  return a;
});

const makeSimplifiedArr = (obj: Readonly<Record<EngineName, number>>) => {
  const countsArr = Object.values(obj);
  const divisor = gcd(countsArr);

  const retval: EngineName[] = [];
  for (let [engine, count] of Object.entries(obj)) {
    if (!count) continue;
    count /= divisor;
    // arbitrary limit; above somewhere around 10^6 chrome starts to struggle hard and will eventually crash
    if (count > 1300000) throw new Error('Provided number(s) too large.');
    for (let i = 0; i < count; ++i) retval.push(engine);
  }
  return [retval, divisor] as const;
};

export const calcStats = (engineCounts: Readonly<Record<EngineName, number>>, cars: number) => {
  const [engineNames, commonFactor] = makeSimplifiedArr(engineCounts);
  const carsPerEngine = cars / (engineNames.length * commonFactor);
  const engineObjects = engineNames.map(el => engines[el]);

  const topSpeed = avg(engineObjects, engine => engine.speed(carsPerEngine));
  const accel = accelerations.get(engineNames)?.(carsPerEngine);

  let accelTime = 0;
  if (accel) accelTime = topSpeed / accel;

  return {
    topSpeed: Math.round(topSpeed),
    hillSpeed: Math.round(topSpeed * avg(engineObjects, engine => engine.climbRating)),
    cost: cars * 16 + commonFactor * sum(engineObjects, engine => engine.cost),
    upkeep: cars + commonFactor * sum(engineObjects, engine => engine.upkeep),
    accel,
    accelTime
  };
};

export const roundThird = (x: number) => {
  const int = Math.floor(x);
  if (x - int <= 1 / 6) return `${int}`;
  if (x - int <= 1 / 2) return (int || '') + '&frac13;';
  if (x - int <= 5 / 6) return (int || '') + '&frac23;';
  return `${int + 1}`;
};

export const roundHalf = (x: number) => {
  const int = Math.floor(x);
  if (x - int <= 1 / 4) return `${int}`;
  if (x - int <= 3 / 4) return (int || '') + '&frac12;';
  return `${int + 1}`;
};

export const stringifyError = (x: unknown) => {
  if (x instanceof Error) return x.toString();

  if ((typeof x != 'object' && typeof x != 'function') || x === null) return `Error: ${x}`;

  const hasCause = (obj: object): obj is { cause: unknown } => 'cause' in obj;
  if (hasCause(x) && x.cause instanceof Error) return x.cause.toString();

  return `Error: ${x}`;
};
