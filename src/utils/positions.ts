export const POSITIONS = [
  { value: "goleiro", label: "Goleiro" },
  { value: "zagueiro", label: "Zagueiro" },
  { value: "lateral", label: "Lateral" },
  { value: "meia", label: "Meia" },
  { value: "atacante", label: "Atacante" },
] as const;

export function positionLabel(value?: string): string | undefined {
  return POSITIONS.find((p) => p.value === value)?.label ?? value;
}
