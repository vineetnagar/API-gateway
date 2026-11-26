const counters = new Map();
export const pickTarget = (route, isUsable = () => true) => {
  const usable = route.targets.filter(isUsable);
  if (usable.length === 0) return null;

  const count = counters.get(route.path) ?? 0;
  counters.set(route.path, count + 1);

  return usable[count % usable.length];
};
