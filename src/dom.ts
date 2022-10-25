// This file contains all code that interacts directly with the DOM.

/// <reference path="logic.ts" />

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
    const stats = calcStats(engineCounts, +elements.cars.value);
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

elements.form.oninput = debounce(reloadStats);
