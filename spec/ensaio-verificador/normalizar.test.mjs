import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizar } from './normalizar.mjs';

test('CA-ENSAIO-01 remove espaços nas extremidades e preserva a grafia', () => {
  assert.equal(normalizar('  TI-0001  '), 'TI-0001');
});
