// This file contains the bulk of the logic, which can be set up without relying on the DOM.

/// <reference path="typing.d.ts" />

// This is a special type of map. Conceptually, it's a Map<Multiset<K>, V>, but just using a Multiset type as the key to
// a Map would be insufficient: Maps use reference equality on their keys. The key type is limited to strings so that
// Array#sort works as expected; since I only use it with string keys, I have no reason to expand it to take a
// compareFn. Similarly, there is no delete method, as I have no need for it.
class SpecialMap<K extends string, V> {
  private backingDict: RecursiveMap<K, V>;

  constructor(entries: Iterable<readonly [Iterable<K>, V]>) {
    this.backingDict = new Map();
    for (const el of entries) this.set(...el);
  }

  get(keys: Iterable<K>): V | undefined {
    let map = this.backingDict;
    const sortedKeys = [...keys].sort();

    for (const key of sortedKeys) {
      const nextMap = map.get(key);
      if (nextMap === undefined) return undefined;
      map = nextMap;
    }

    return map.get(undefined);
  }

  set(keys: Iterable<K>, value: V) {
    let map = this.backingDict;
    const sortedKeys = [...keys].sort();

    for (const key of sortedKeys) {
      let nextMap = map.get(key);

      if (nextMap === undefined) {
        nextMap = new Map();
        map.set(key, nextMap);
      }

      map = nextMap;
    }

    map.set(undefined, value);
  }
}

class Engine {
  readonly cost: number;
  readonly upkeep: number;

  constructor(
    costPower: number,
    upkeepPower: number,
    readonly climbRating: number,
    readonly speed: (costPerEngine: number) => number
  ) {
    this.cost = 1 << (costPower + 8);
    this.upkeep = 1 << (upkeepPower + 2);
  }
}

const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(x, max));

// I don't actually know what the speed/acceleration formulas are.
// These are just formulas that are accurate based on experimental data.
const engines = {
  workhorse: new Engine(1, 1, 0.5, carsPerEngine => {
    if (carsPerEngine <= 2) return 50;
    if (carsPerEngine <= 4) return 54 - 2 * carsPerEngine;
    return Math.max(5, 70 - 6 * carsPerEngine);
  }),
  boiler: new Engine(0, 0, 0.4, carsPerEngine => {
    if (carsPerEngine < 6) return 33 - (carsPerEngine ** 4) / 230;
    return Math.max(3, 47.7 - 3.5 * carsPerEngine);
  }),
  industrial: new Engine(
    2, 2, 0.95,
    carsPerEngine => clamp(48 - 3.5 * carsPerEngine, 3, 30)
  ),
  spark: new Engine(3, 3, 0.5, carsPerEngine => {
    if (carsPerEngine <= 4.5) return 75;
    if (carsPerEngine <= 6) return 85 - 2 * carsPerEngine;
    if (carsPerEngine >= 8) return 112.75 - 5.5 * carsPerEngine;
    // It's mostly piecewise linear, but idk what's going on in the range (6, 8)
    // idk. Treat all points in that range as 7.
    return 71;
  }),
  custom: new Engine(1, 1, 0.75, carsPerEngine => {
    if (carsPerEngine >= 2) return Math.max(7, 97.84 - 14.6 * carsPerEngine);
    return Math.min(75, 78.83 - 5 * carsPerEngine);
  }),
  rescue: new Engine(3, 2, 1, carsPerEngine => {
    if (carsPerEngine <= 8) return 27;
    if (carsPerEngine <= 12) return 30.75 - carsPerEngine / 2;
    return 41.6 - 1.4 * carsPerEngine;
  })
};

type EngineName = keyof typeof engines;

const accelerations = new SpecialMap<EngineName, (carsPerEngine: number) => number>([
  [[], () => 0],
  [['workhorse'], carsPerEngine => {
    if (carsPerEngine < 4) return 3.5 - carsPerEngine / 7;
    return Math.max(1 / 3, 4.9 - carsPerEngine / 2);
  }],
  [['boiler'], carsPerEngine => Math.max(1 / 3, 2.59 - 0.024 * (carsPerEngine ** 2))],
  [['industrial'], carsPerEngine => {
    if (carsPerEngine < 7) return 4 - carsPerEngine / 9;
    return Math.max(1 / 3, 5.25 - (2 / 7) * carsPerEngine);
  }],
  [['spark'], carsPerEngine => {
    if (carsPerEngine >= 17) return 1 / 3;
    if (carsPerEngine > 8) return 8.9 - 0.5 * carsPerEngine;
    if (carsPerEngine < 7) return 6.2 - 0.17 * carsPerEngine;
    return 5;
  }],
  [['custom'], carsPerEngine => {
    if (carsPerEngine > 2) return Math.max(1 / 3, 5.76 - carsPerEngine);
    if (carsPerEngine === 0) return 14 / 3;
    if (carsPerEngine <= 1) return 13 / 3;
    return 4;
  }],
  [['rescue'], carsPerEngine => {
    if (carsPerEngine < 10) return 5.04 - 0.106 * carsPerEngine;
    if (carsPerEngine <= 12) return 4;
    return 8 - carsPerEngine / 3;
  }],
  // TODO: Add some functions for combinations. These go by ratios, so
  // [['boiler', 'workhorse'], ...] // only 1:1 ratio
  // [['boiler', 'workhorse', 'workhorse'], ...] // only 1:2 ratio
  // etc
]);

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

const calcStats = (engineCounts: Readonly<Record<EngineName, number>>, cars: number) => {
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

const roundThird = (x: number) => {
  const int = Math.floor(x);
  if (x - int <= 1/6) return `${int}`;
  if (x - int <= 1/2) return (int || '') + '&frac13;';
  if (x - int <= 5/6) return (int || '') + '&frac23;';
  return `${int + 1}`;
};

const roundHalf = (x: number) => {
  const int = Math.floor(x);
  if (x - int <= 1/4) return `${int}`;
  if (x - int <= 3/4) return (int || '') + '&frac12;';
  return `${int + 1}`;
};

const stringifyError = (x: unknown) => {
  if (x instanceof Error) return x.toString();

  if ((typeof x != 'object' && typeof x != 'function') || x === null) return `Error: ${x}`;

  const hasCause = (obj: object): obj is { cause: unknown } => 'cause' in obj;
  if (hasCause(x) && x.cause instanceof Error) return x.cause.toString();

  return `Error: ${x}`;
};
