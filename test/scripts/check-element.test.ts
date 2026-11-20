import { expect, it } from 'vitest';
import { findImports } from '../../scripts/find-imports.mjs';

it.each([
  ['import{a}from"x"', 'x'],
  ['import x,{y}from"z"', 'z'],
  ['export * as ns from "x"', 'x'],
  ['a();import"x"', 'x'],
  ['if(a){}import{b}from"x"', 'x'],
  ['import"x"', 'x'],
  ['import "x";', 'x'],
  ['import a from"x"', 'x'],
  ['import {\n a,\n b\n} from "x"', 'x'],
  ['export*from"x"', 'x'],
  ['export{a}from"x"', 'x'],
  ['export {\n a\n} from "x"', 'x'],
  ['import("x")', 'x'],
  ['import ("x")', 'x'],
])('finds %j', async (code, specifier) => {
  expect(await findImports(code)).toEqual([specifier]);
});

it('ignores import text inside a string', async () => {
  expect(await findImports('const s = \'import "x"\';')).toEqual([]);
});

it('ignores a module with no imports', async () => {
  expect(await findImports('export const a = 1;')).toEqual([]);
});
