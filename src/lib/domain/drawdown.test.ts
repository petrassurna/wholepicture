import { describe, it, expect } from 'vitest';
import { minDrawdownRate } from './drawdown';

describe('minDrawdownRate', () => {
	it('steps up through the ATO age bands', () => {
		expect(minDrawdownRate(60)).toBe(0.04);
		expect(minDrawdownRate(64)).toBe(0.04);
		expect(minDrawdownRate(65)).toBe(0.05);
		expect(minDrawdownRate(74)).toBe(0.05);
		expect(minDrawdownRate(75)).toBe(0.06);
		expect(minDrawdownRate(79)).toBe(0.06);
		expect(minDrawdownRate(80)).toBe(0.07);
		expect(minDrawdownRate(84)).toBe(0.07);
		expect(minDrawdownRate(85)).toBe(0.09);
		expect(minDrawdownRate(89)).toBe(0.09);
		expect(minDrawdownRate(90)).toBe(0.11);
		expect(minDrawdownRate(94)).toBe(0.11);
		expect(minDrawdownRate(95)).toBe(0.14);
		expect(minDrawdownRate(105)).toBe(0.14);
	});
});
