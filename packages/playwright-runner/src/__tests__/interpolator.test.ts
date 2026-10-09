import { describe, it, expect } from 'vitest';
import { interpolate, interpolateStep } from '../context/interpolator.js';

describe('Interpolador de variables de contexto (S7-006)', () => {
  it('reemplaza una sola variable dentro de un string', () => {
    const result = interpolate('El precio es ${ctx.price} MXN', { price: '199' });
    expect(result).toBe('El precio es 199 MXN');
  });

  it('reemplaza múltiples variables distintas en el mismo string', () => {
    const result = interpolate('${ctx.user} compró ${ctx.item}', { user: 'Diego', item: 'laptop' });
    expect(result).toBe('Diego compró laptop');
  });

  it('deja intacto un string sin ningún placeholder', () => {
    const result = interpolate('#add-to-cart', {});
    expect(result).toBe('#add-to-cart');
  });

  it('lanza un error claro si la variable referenciada no existe', () => {
    expect(() => interpolate('${ctx.inexistente}', {})).toThrow(/inexistente.*no definida/i);
  });

  it('interpolateStep reemplaza selector, value y url de un step', () => {
    const step = interpolateStep(
      { type: 'fill', selector: '#${ctx.fieldId}', value: 'hola ${ctx.name}' },
      { fieldId: 'email', name: 'Diego' }
    );

    expect(step.selector).toBe('#email');
    expect(step.value).toBe('hola Diego');
  });

  it('interpolateStep NO toca el campo expression (evaluate usa ctx directamente)', () => {
    const step = interpolateStep(
      { type: 'evaluate', expression: 'ctx.total * 2' },
      { total: '50' }
    );

    // El texto se conserva literal: 'evaluate' resuelve ctx.* en runtime, no aquí.
    expect(step.expression).toBe('ctx.total * 2');
  });

  it('interpolateStep no modifica el step original (devuelve una copia)', () => {
    const original = { type: 'click' as const, selector: '${ctx.btn}' };
    const interpolated = interpolateStep(original, { btn: '#submit' });

    expect(original.selector).toBe('${ctx.btn}');
    expect(interpolated.selector).toBe('#submit');
  });
});