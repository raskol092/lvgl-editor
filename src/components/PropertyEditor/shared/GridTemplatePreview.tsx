// Grid template visualization: parse "1fr 2fr 1fr" into proportional bars
export function GridTemplatePreview({ value }: { value: string }) {
  const parts = (value || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const nums = parts.map(p => {
    const n = parseFloat(p);
    return isNaN(n) || n <= 0 ? 1 : n;
  });
  return (
    <div className="grid-template-preview">
      {nums.map((n, i) => (
        <div
          key={i}
          className="grid-template-bar"
          style={{ flex: n }}
          title={parts[i]}
        >
          <span className="grid-template-bar-label">{parts[i]}</span>
        </div>
      ))}
    </div>
  );
}
