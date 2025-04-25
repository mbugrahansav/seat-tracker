export function parseKoltukSayisi(value: string): number {
  if (value === "DOLU") return 0;
  const match = value.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : 0;
}