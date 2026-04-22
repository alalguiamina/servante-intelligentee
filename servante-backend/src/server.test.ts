import { test, expect, describe } from 'vitest';

describe('Hello World Test Suite', () => {
	test('should pass a basic assertion', () => {
		expect(1 + 1).toBe(2);
	});

	test('should work with strings', () => {
		expect('hello').toBe('hello');
	});
});