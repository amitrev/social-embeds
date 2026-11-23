import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

const src = join(import.meta.dirname, '..', '..', 'src');
const PURE = /\/\*\s*[#@]__PURE__\s*\*\/\s*$/;

/**
 * Top-level initialisers a minifier cannot drop when unused: calls and `new` without a pure
 * annotation, and object literals with a spread (docs/decisions.md D118).
 */
function unremovable(file: string): string[] {
  const text = readFileSync(join(src, file), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const { name, initializer } of statement.declarationList
      .declarations) {
      if (!initializer) continue;
      const label = `${file}: ${name.getText()}`;
      if (
        (ts.isCallExpression(initializer) || ts.isNewExpression(initializer)) &&
        !PURE.test(text.slice(0, initializer.getStart()))
      )
        found.push(`${label} (call)`);
      if (
        ts.isObjectLiteralExpression(initializer) &&
        initializer.properties.some(ts.isSpreadAssignment)
      )
        found.push(`${label} (spread)`);
    }
  }
  return found;
}

it('leaves no module-level value a minifier must keep', () => {
  const files = readdirSync(src, { recursive: true, encoding: 'utf8' }).filter(
    // `social-embeds/element` registers itself: its side effects are the point.
    (file) => /\.tsx?$/.test(file) && !file.startsWith('element'),
  );
  expect(files.length).toBeGreaterThan(100);
  expect(files.flatMap(unremovable)).toEqual([]);
});
