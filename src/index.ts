interface ObjectConstructor {
  // The default typing returns [string, V][] instead
  entries<K extends string | number, V>(o: Record<K | symbol, V>): [`${K}`, V][];
}

class Engine {
  readonly cost: number;
  readonly upkeep: number;

  constructor(
    costPower: number,
    upkeepPower: number,
    readonly climbRating: number,
    readonly speed: (costPerEngine: number) => number,
    readonly accel: (costPerEngine: number) => number
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
  }, carsPerEngine => {
    if (carsPerEngine < 4) return 3.5 - carsPerEngine / 7;
    return Math.max(1/3, 4.9 - carsPerEngine / 2);
  }),
  boiler: new Engine(0, 0, 0.4, carsPerEngine => {
    if (carsPerEngine < 6) return 33 - (carsPerEngine ** 4) / 230;
    return Math.max(3, 47.7 - 3.5 * carsPerEngine);
  }, carsPerEngine => Math.max(1/3, 2.59 - 0.024 * (carsPerEngine ** 2))),
  industrial: new Engine(
    2, 2, 0.95,
    carsPerEngine => clamp(48 - 3.5 * carsPerEngine, 3, 30),
    carsPerEngine => {
      if (carsPerEngine < 7) return 4 - carsPerEngine / 9;
      return Math.max(1/3, 5.25 - (2/7) * carsPerEngine);
    }
  ),
  spark: new Engine(3, 3, 0.5, carsPerEngine => {
    if (carsPerEngine <= 4.5) return 75;
    if (carsPerEngine <= 6) return 85 - 2 * carsPerEngine;
    if (carsPerEngine >= 8) return 112.75 - 5.5 * carsPerEngine;
    // It's mostly piecewise linear, but idk what's going on in the range (6, 8)
    // idk. Treat all points in that range as 7.
    return 71;
  }, carsPerEngine => {
    if (carsPerEngine >= 17) return 1/3;
    if (carsPerEngine > 8) return 8.9 - 0.5 * carsPerEngine;
    if (carsPerEngine < 7) return 6.2 - 0.17 * carsPerEngine;
    return 5;
  }),
  custom: new Engine(1, 1, 0.75, carsPerEngine => {
    if (carsPerEngine >= 2) return Math.max(7, 97.84 - 14.6 * carsPerEngine);
    return Math.min(75, 78.83 - 5 * carsPerEngine);
  }, carsPerEngine => {
    if (carsPerEngine > 2) return Math.max(1/3, 5.76 - carsPerEngine);
    if (carsPerEngine === 0) return 14/3;
    if (carsPerEngine <= 1) return 13/3;
    return 4;
  }),
  rescue: new Engine(3, 2, 1, carsPerEngine => {
    if (carsPerEngine <= 8) return 27;
    if (carsPerEngine <= 12) return 30.75 - carsPerEngine / 2;
    return 41.6 - 1.4 * carsPerEngine;
  }, carsPerEngine => {
    if (carsPerEngine < 10) return 5.04 - 0.106 * carsPerEngine;
    if (carsPerEngine <= 12) return 4;
    return 8 - carsPerEngine / 3;
  })
};

type EngineName = keyof typeof engines;

const allSame = (arr: readonly unknown[]) => {
  const firstItem = arr[0];
  for (const item of arr) {
    if (item !== firstItem) return false;
  }
  return true;
};

const makeArr = (obj: Record<EngineName, number>) => {
  const arr: EngineName[] = [];
  for (const [engine, count] of Object.entries(obj)) {
    if (!count) continue;
    // arbitrary limit; above somewhere around 10^6 chrome starts to struggle hard and will eventually crash
    if (count > 1300000) throw new Error('Provided number(s) too large.');
    for (let i = 0; i < count; ++i) arr.push(engine);
  }
  return arr;
};

const avg = function<T> (arr: readonly T[], f: (arg: T) => number) {
  return arr.reduce((prev, el) => prev + f(el) / arr.length, 0);
};

const sum = function<T> (arr: readonly T[], f: (arg: T) => number) {
  return arr.reduce((prev, el) => prev + f(el), 0);
};

const calcStats = (engineNames: readonly EngineName[], cars: number) => {
  const carsPerEngine = cars / engineNames.length;
  const engineObjects = engineNames.map(el => engines[el]);
  const topSpeed = avg(engineObjects, engine => engine.speed(carsPerEngine));

  let accel: number | undefined;
  if (engineNames.length === 0) accel = 0;
  else if (allSame(engineNames)) accel = engineObjects[0].accel(carsPerEngine);

  let accelTime = 0;
  if (accel) accelTime = topSpeed / accel;

  return {
    topSpeed: Math.round(topSpeed),
    hillSpeed: Math.round(topSpeed * avg(engineObjects, engine => engine.climbRating)),
    cost: cars * 16 + sum(engineObjects, engine => engine.cost),
    upkeep: cars + sum(engineObjects, engine => engine.upkeep),
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

const elements = {
  workhorse: document.getElementById('workhorse') as HTMLInputElement,
  boiler: document.getElementById('boiler') as HTMLInputElement,
  industrial: document.getElementById('industrial') as HTMLInputElement,
  spark: document.getElementById('spark') as HTMLInputElement,
  custom: document.getElementById('custom') as HTMLInputElement,
  rescue: document.getElementById('rescue') as HTMLInputElement,
  cars: document.getElementById('cars') as HTMLInputElement,
  topSpeed: document.getElementById('top-speed') as HTMLSpanElement,
  hillSpeed: document.getElementById('hill-speed') as HTMLSpanElement,
  cost: document.getElementById('cost') as HTMLSpanElement,
  upkeep: document.getElementById('upkeep') as HTMLSpanElement,
  accelInfo: document.getElementById('accel-info') as HTMLDivElement,
  noAccelInfo: document.getElementById('no-accel-info') as HTMLDivElement,
  accel: document.getElementById('accel') as HTMLSpanElement,
  accelTime: document.getElementById('accel-time') as HTMLSpanElement,
  error: document.getElementById('error') as HTMLSpanElement,
  form: document.getElementById('car-counts') as HTMLFormElement
};

const stringifyError = (x: unknown) => {
  if (x instanceof Error) return x.toString();

  if ((typeof x != 'object' && typeof x != 'function') || x === null) return `Error: ${x}`;

  const hasCause = (obj: object): obj is { cause: unknown } => 'cause' in obj;
  if (hasCause(x) && x.cause instanceof Error) return x.cause.toString();

  return `Error: ${x}`;
};

const reloadStats = () => {
  elements.error.hidden = true;
  try {
    const engineCounts = {
      workhorse: +elements.workhorse.value,
      boiler: +elements.boiler.value,
      industrial: +elements.industrial.value,
      spark: +elements.spark.value,
      custom: +elements.custom.value,
      rescue: +elements.rescue.value
    };
    const stats = calcStats(makeArr(engineCounts), +elements.cars.value);
    elements.topSpeed.textContent = `${stats.topSpeed}`;
    elements.hillSpeed.textContent = `${stats.hillSpeed}`;
    elements.cost.textContent = `${stats.cost}`;
    elements.upkeep.textContent = `${stats.upkeep}`;

    if (stats.accel === undefined) {
      elements.accelInfo.hidden = true;
      elements.noAccelInfo.hidden = false;
    } else {
      elements.accelInfo.hidden = false;
      elements.noAccelInfo.hidden = true;

      elements.accel.innerHTML = roundThird(stats.accel);
      elements.accelTime.innerHTML = roundHalf(stats.accelTime);
    }
    console.log(stats);
  } catch (e) {
    elements.error.innerHTML = '';
    elements.error.appendChild(document.createTextNode(stringifyError(e)));
    elements.error.appendChild(document.createElement('br'));
    elements.error.hidden = false;
  }
};

const debounceTable: Partial<Record<string, Map<EventTarget, number>>> = {};

const debounce = (func: (e: Event) => void, time = 100) => (e: Event) => {
  const target = e.currentTarget;
  if (target === null) return func(e);

  const map = (debounceTable[e.type] ??= new Map<EventTarget, number>());

  let timeout = map.get(target);
  if (timeout !== undefined) clearTimeout(timeout);

  timeout = setTimeout(() => {
    func(e);
    map.delete(target);
  }, time);
  map.set(target, timeout);
};

elements.form.oninput = debounce(reloadStats);
