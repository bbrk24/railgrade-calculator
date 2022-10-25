interface ObjectConstructor {
  // The default typing returns [string, V][] instead
  entries<K extends string | number, V>(o: Record<K | symbol, V>): [`${K}`, V][];
}

type RecursiveMap<K, V> = Map<K, RecursiveMap<K, V>> & Map<undefined, V>;
