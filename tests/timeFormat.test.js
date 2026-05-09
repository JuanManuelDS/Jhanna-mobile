import { clamp, parseNumeric } from '../src/utils/timeFormat';

describe('clamp', () => {
  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it('clamps to max', () => {
    expect(clamp(20, 0, 10)).toBe(10);
  });
  it('passes through within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('parseNumeric', () => {
  it('parses pure digits', () => {
    expect(parseNumeric('123')).toBe(123);
  });
  it('strips non-digits', () => {
    expect(parseNumeric('1a2b3')).toBe(123);
  });
  it('returns NaN for empty / non-numeric', () => {
    expect(Number.isNaN(parseNumeric(''))).toBe(true);
    expect(Number.isNaN(parseNumeric('abc'))).toBe(true);
    expect(Number.isNaN(parseNumeric(null))).toBe(true);
  });
});
