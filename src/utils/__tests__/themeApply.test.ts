import { describe, it, expect } from 'vitest'
import { buildColorMap, themeComponent } from '../themeApply'
import { createComponent, createStyleProps } from '../../codegen/__tests__/helpers'

const light = { primary: '#2196F3', secondary: '#03A9F4', background: '#ffffff', surface: '#f5f5f5', text: '#333333', border: '#e0e0e0' }
const dark = { primary: '#90CAF9', secondary: '#4FC3F7', background: '#121212', surface: '#1e1e1e', text: '#e0e0e0', border: '#333333' }

describe('themeApply', () => {
  it('moves default dark text (#212121, black) to the theme text color, but not shadows', () => {
    const c = createComponent('label' as never, {
      id: 'a', name: 'a',
      styles: { default: createStyleProps({ textColor: '#212121', shadowColor: '#000000', bgColor: '#2196F3' }) },
    } as never)
    const out = themeComponent(c, buildColorMap(light, dark))
    expect(out.styles.default.textColor).toBe('#e0e0e0')
    expect(out.styles.default.shadowColor).toBe('#000000')
    expect(out.styles.default.bgColor).toBe('#90CAF9')
  })
})
