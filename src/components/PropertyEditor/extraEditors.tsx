// Property sections of the widgets that are not part of the original set: roller, spinbox, keyboard, list, message box, scale.
import React from 'react';
import { t } from '../../i18n';

type OnChange = (key: string, value: unknown) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>;

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="property-row">
    <label>{label}</label>
    {children}
  </div>
);

const Num: React.FC<{ value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }> = ({ value, onChange, min, max, step }) => (
  <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
);

/** One option / item per line */
const Lines: React.FC<{ label: string; value: string[]; onChange: (v: string[]) => void }> = ({ label, value, onChange }) => (
  <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
    <label>{label}</label>
    <textarea
      rows={Math.min(8, Math.max(3, value.length + 1))}
      value={value.join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n'))}
      style={{ width: '100%', resize: 'vertical' }}
    />
  </div>
);

const Check: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void }> = ({ label, value, onChange }) => (
  <Row label={label}><input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /></Row>
);

const Select: React.FC<{ label: string; value: string; options: Array<[string, string]>; onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
  <Row label={label}>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </Row>
);

const Color: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <Row label={label}>
    <div className="color-input-wrapper">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="color-text" />
    </div>
  </Row>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="property-section">
    <div className="section-header">{title}</div>
    {children}
  </div>
);

export function ExtraWidgetEditor({ type, props, onChange }: { type: string; props: Props; onChange: OnChange }): React.ReactElement | null {
  switch (type) {
    case 'roller': {
      const options: string[] = props.options || [];
      return (
        <Section title={t('Roller')}>
          <Lines label={t('Options')} value={options} onChange={(v) => onChange('options', v)} />
          <Row label={t('Default selected')}>
            <select value={props.selected || 0} onChange={(e) => onChange('selected', parseInt(e.target.value) || 0)}>
              {options.map((o, i) => <option key={i} value={i}>{i}: {o}</option>)}
            </select>
          </Row>
          <Row label={t('Visible rows')}><Num value={props.visibleRows ?? 3} min={1} max={9} onChange={(v) => onChange('visibleRows', Math.max(1, Math.round(v)))} /></Row>
          <Select label={t('Scroll mode')} value={props.mode || 'normal'} options={[['normal', t('Normal')], ['infinite', t('Infinite')]]} onChange={(v) => onChange('mode', v)} />
        </Section>
      );
    }
    case 'spinbox':
      return (
        <Section title={t('Spinbox')}>
          <Row label={t('Value')}><Num value={props.value ?? 0} onChange={(v) => onChange('value', Math.round(v))} /></Row>
          <Row label={t('Min')}><Num value={props.min ?? 0} onChange={(v) => onChange('min', Math.round(v))} /></Row>
          <Row label={t('Max')}><Num value={props.max ?? 100} onChange={(v) => onChange('max', Math.round(v))} /></Row>
          <Row label={t('Step')}><Num value={props.step ?? 1} min={1} onChange={(v) => onChange('step', Math.max(1, Math.round(v)))} /></Row>
          <Row label={t('Digits')}><Num value={props.digitCount ?? 4} min={1} max={10} onChange={(v) => onChange('digitCount', Math.max(1, Math.round(v)))} /></Row>
          <Row label={t('Decimal digits')}><Num value={props.decimalPos ?? 0} min={0} max={9} onChange={(v) => onChange('decimalPos', Math.max(0, Math.round(v)))} /></Row>
          <Check label={t('Rollover')} value={props.rollover === true} onChange={(v) => onChange('rollover', v)} />
        </Section>
      );
    case 'keyboard':
      return (
        <Section title={t('Keyboard')}>
          <Select
            label={t('Layout')}
            value={props.mode || 'text_lower'}
            options={[['text_lower', t('Lower case')], ['text_upper', t('Upper case')], ['special', t('Special')], ['number', t('Number')]]}
            onChange={(v) => onChange('mode', v)}
          />
          <Row label={t('Text area name')}>
            <input type="text" value={props.textarea || ''} placeholder="textarea_name" onChange={(e) => onChange('textarea', e.target.value)} />
          </Row>
        </Section>
      );
    case 'list':
      return (
        <Section title={t('List')}>
          <Lines label={t('Items')} value={props.items || []} onChange={(v) => onChange('items', v)} />
        </Section>
      );
    case 'msgbox':
      return (
        <Section title={t('Message box')}>
          <Row label={t('Title')}><input type="text" value={props.title || ''} onChange={(e) => onChange('title', e.target.value)} /></Row>
          <div className="property-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
            <label>{t('Text')}</label>
            <textarea rows={3} value={props.text || ''} onChange={(e) => onChange('text', e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
          </div>
          <Lines label={t('Buttons')} value={props.buttons || []} onChange={(v) => onChange('buttons', v)} />
          <Check label={t('Close button')} value={props.showClose !== false} onChange={(v) => onChange('showClose', v)} />
        </Section>
      );
    case 'scale': {
      const round = String(props.mode || '').startsWith('round');
      return (
        <Section title={t('Scale')}>
          <Select
            label={t('Mode')}
            value={props.mode || 'horizontal_bottom'}
            options={[
              ['horizontal_bottom', t('Horizontal, ticks below')], ['horizontal_top', t('Horizontal, ticks above')],
              ['vertical_left', t('Vertical, ticks left')], ['vertical_right', t('Vertical, ticks right')],
              ['round_inner', t('Round, inner ticks')], ['round_outer', t('Round, outer ticks')],
            ]}
            onChange={(v) => onChange('mode', v)}
          />
          <Row label={t('Min')}><Num value={props.min ?? 0} onChange={(v) => onChange('min', Math.round(v))} /></Row>
          <Row label={t('Max')}><Num value={props.max ?? 100} onChange={(v) => onChange('max', Math.round(v))} /></Row>
          <Row label={t('Tick count')}><Num value={props.totalTicks ?? 11} min={2} onChange={(v) => onChange('totalTicks', Math.max(2, Math.round(v)))} /></Row>
          <Row label={t('Major tick every')}><Num value={props.majorEvery ?? 5} min={1} onChange={(v) => onChange('majorEvery', Math.max(1, Math.round(v)))} /></Row>
          <Check label={t('Show labels')} value={props.showLabels !== false} onChange={(v) => onChange('showLabels', v)} />
          {round && (
            <>
              <Row label={t('Angle range')}><Num value={props.angleRange ?? 270} min={1} max={360} onChange={(v) => onChange('angleRange', Math.round(v))} /></Row>
              <Row label={t('Rotation')}><Num value={props.rotation ?? 135} min={0} max={360} onChange={(v) => onChange('rotation', Math.round(v))} /></Row>
            </>
          )}
          <Check label={t('Needle')} value={props.needle === true} onChange={(v) => onChange('needle', v)} />
          {props.needle === true && (
            <>
              <Row label={t('Needle value')}><Num value={props.needleValue ?? 50} onChange={(v) => onChange('needleValue', Math.round(v))} /></Row>
              <Row label={t('Needle length')}><Num value={props.needleLength ?? 60} min={1} onChange={(v) => onChange('needleLength', Math.max(1, Math.round(v)))} /></Row>
              <Row label={t('Needle width')}><Num value={props.needleWidth ?? 3} min={1} onChange={(v) => onChange('needleWidth', Math.max(1, Math.round(v)))} /></Row>
              <Color label={t('Needle color')} value={props.needleColor || '#EF4444'} onChange={(v) => onChange('needleColor', v)} />
            </>
          )}
        </Section>
      );
    }
    default:
      return null;
  }
}

/** Additional per-widget properties (modes, rotation, scale, dashes, axes...) shown under the main section. */
export function MoreWidgetProps({ type, props, onChange }: { type: string; props: Props; onChange: OnChange }): React.ReactElement | null {
  switch (type) {
    case 'label':
      return (
        <Section title={t('Label options')}>
          <Select
            label={t('Long text')}
            value={props.longMode || 'wrap'}
            options={[['wrap', t('Wrap')], ['scroll', t('Scroll')], ['scroll_circular', t('Scroll circular')], ['dot', t('Dots')], ['clip', t('Clip')]]}
            onChange={(v) => onChange('longMode', v)}
          />
          <Check label={t('Colour markup (#RRGGBB text#)')} value={props.recolor === true} onChange={(v) => onChange('recolor', v)} />
        </Section>
      );
    case 'slider':
    case 'bar':
      return (
        <Section title={type === 'slider' ? t('Slider mode') : t('Bar mode')}>
          <Select
            label={t('Mode')}
            value={props.mode || 'normal'}
            options={[['normal', t('Normal')], ['symmetrical', t('Symmetrical')], ['range', t('Range (two values)')]]}
            onChange={(v) => onChange('mode', v)}
          />
          {props.mode === 'range' && (
            <Row label={t('Start value')}><Num value={props.startValue ?? props.min ?? 0} onChange={(v) => onChange('startValue', Math.round(v))} /></Row>
          )}
        </Section>
      );
    case 'arc':
      return (
        <Section title={t('Arc options')}>
          <Row label={t('Rotation')}><Num value={props.rotation ?? 0} min={0} max={360} onChange={(v) => onChange('rotation', Math.round(v))} /></Row>
          <Row label={t('Change rate (deg/s)')}><Num value={props.changeRate ?? 720} min={0} onChange={(v) => onChange('changeRate', Math.max(0, Math.round(v)))} /></Row>
          <Check label={t('Rounded ends')} value={props.rounded !== false} onChange={(v) => onChange('rounded', v)} />
        </Section>
      );
    case 'img':
      return (
        <Section title={t('Image options')}>
          <Select
            label={t('Inner align')}
            value={props.innerAlign || 'stretch'}
            options={[['stretch', t('Stretch')], ['contain', t('Contain')], ['cover', t('Cover')], ['center', t('Center')], ['tile', t('Tile')], ['top_left', t('Top left')]]}
            onChange={(v) => onChange('innerAlign', v)}
          />
          <Row label={t('Scale X (256 = 100%)')}><Num value={props.scaleX ?? 256} min={0} onChange={(v) => onChange('scaleX', Math.max(0, Math.round(v)))} /></Row>
          <Row label={t('Scale Y (256 = 100%)')}><Num value={props.scaleY ?? 256} min={0} onChange={(v) => onChange('scaleY', Math.max(0, Math.round(v)))} /></Row>
          <Row label={t('Pivot X')}><Num value={props.pivotX ?? 0} onChange={(v) => onChange('pivotX', Math.round(v))} /></Row>
          <Row label={t('Pivot Y')}><Num value={props.pivotY ?? 0} onChange={(v) => onChange('pivotY', Math.round(v))} /></Row>
        </Section>
      );
    case 'line':
      return (
        <Section title={t('Line options')}>
          <Check label={t('Rounded ends')} value={props.rounded !== false} onChange={(v) => onChange('rounded', v)} />
          <Check label={t('Invert Y')} value={props.yInvert === true} onChange={(v) => onChange('yInvert', v)} />
          <Row label={t('Dash width')}><Num value={props.dashWidth ?? 0} min={0} onChange={(v) => onChange('dashWidth', Math.max(0, Math.round(v)))} /></Row>
          <Row label={t('Dash gap')}><Num value={props.dashGap ?? 4} min={0} onChange={(v) => onChange('dashGap', Math.max(0, Math.round(v)))} /></Row>
        </Section>
      );
    case 'switch':
      return (
        <Section title={t('Switch options')}>
          <Select
            label={t('Orientation')}
            value={props.orientation || 'auto'}
            options={[['auto', t('Auto')], ['horizontal', t('Horizontal')], ['vertical', t('Vertical')]]}
            onChange={(v) => onChange('orientation', v)}
          />
        </Section>
      );
    case 'textarea':
      return props.password ? (
        <Section title={t('Password')}>
          <Row label={t('Show last char for (ms)')}><Num value={props.passwordShowTime ?? 1500} min={0} onChange={(v) => onChange('passwordShowTime', Math.max(0, Math.round(v)))} /></Row>
        </Section>
      ) : null;
    case 'chart': {
      const series: Array<{ name?: string; axis?: string }> = props.series || [];
      return (
        <Section title={t('Chart options')}>
          <Select
            label={t('Update mode')}
            value={props.updateMode || 'shift'}
            options={[['shift', t('Shift')], ['circular', t('Circular')]]}
            onChange={(v) => onChange('updateMode', v)}
          />
          <Row label={t('Point count')}><Num value={props.pointCount ?? 0} min={0} onChange={(v) => onChange('pointCount', Math.max(0, Math.round(v)))} /></Row>
          <Row label={t('Horizontal grid lines')}><Num value={props.horDivs ?? 3} min={0} onChange={(v) => onChange('horDivs', Math.max(0, Math.round(v)))} /></Row>
          <Row label={t('Vertical grid lines')}><Num value={props.verDivs ?? 5} min={0} onChange={(v) => onChange('verDivs', Math.max(0, Math.round(v)))} /></Row>
          <Row label={t('Secondary Y min')}><Num value={props.y2AxisMin ?? 0} onChange={(v) => onChange('y2AxisMin', Math.round(v))} /></Row>
          <Row label={t('Secondary Y max')}><Num value={props.y2AxisMax ?? 100} onChange={(v) => onChange('y2AxisMax', Math.round(v))} /></Row>
          {series.map((sr, i) => (
            <Check
              key={i}
              label={`${sr.name || `${t('Series')} ${i + 1}`}: ${t('secondary axis')}`}
              value={sr.axis === 'secondary'}
              onChange={(v) => onChange('series', series.map((o, j) => (j === i ? { ...o, axis: v ? 'secondary' : 'primary' } : o)))}
            />
          ))}
        </Section>
      );
    }
    default:
      return null;
  }
}
