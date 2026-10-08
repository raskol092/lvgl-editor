

/** indicator span (left %, width %) of slider / bar for normal, symmetrical and range modes */
export function indicatorSpan(props: Record<string, any>, def: number): [number, number] { // eslint-disable-line @typescript-eslint/no-explicit-any
  const mn = Number(props.min ?? 0);
  const mx = Number(props.max ?? 100);
  const pct = (v: number) => (mx > mn ? Math.max(0, Math.min(100, ((v - mn) / (mx - mn)) * 100)) : 0);
  const val = pct(Number(props.value ?? def));
  if (props.mode === 'range') {
    const st = pct(Number(props.startValue ?? mn));
    return [Math.min(st, val), Math.abs(val - st)];
  }
  if (props.mode === 'symmetrical') {
    const zero = pct(mn < 0 && mx > 0 ? 0 : mn);
    return [Math.min(zero, val), Math.abs(val - zero)];
  }
  return [0, val];
}
