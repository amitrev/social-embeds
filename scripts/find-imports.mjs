import { init, parse } from 'es-module-lexer';

/** Specifiers of every static and dynamic import or re-export in `code`. */
export async function findImports(code) {
  await init;
  const [imports] = parse(code);
  return imports.map((i) => i.n ?? code.slice(i.s, i.e));
}
