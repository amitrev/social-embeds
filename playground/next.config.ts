import type { NextConfig } from 'next';

// Set only by the Pages workflow: a static export served under the repository's path.
const basePath = process.env.PAGES_BASE_PATH;

const config: NextConfig = basePath
  ? { output: 'export', basePath, trailingSlash: true }
  : {};

export default config;
