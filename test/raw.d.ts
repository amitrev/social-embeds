// Fixtures are imported verbatim through Vite's `?raw` suffix, so tests need no Node APIs.
declare module '*?raw' {
  const content: string;
  export default content;
}
