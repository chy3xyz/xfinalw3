const path = require("path");

const buildNextEslintCommand = (filenames) =>
  `bun next:lint --fix --file ${filenames
    .map((f) => path.relative(path.join("packages", "nextjs"), f))
    .join(" --file ")}`;

const checkTypesNextCommand = () => "bun next:check-types";

// Biome check and format for all supported files
const biomeCheckCommand = (filenames) =>
  `bun biome check --write ${filenames.join(" ")}`;

module.exports = {
  // Biome handles formatting and linting for most files
  "*.{js,jsx,ts,tsx,json,css,md}": [biomeCheckCommand],
  // Next.js specific: ESLint and type checking
  "packages/nextjs/**/*.{ts,tsx}": [
    buildNextEslintCommand,
    checkTypesNextCommand,
  ],
  // Foundry: use forge fmt for Solidity files
  "packages/foundry/**/*.sol": [
    (filenames) => `bun foundry:format ${filenames.join(" ")}`,
  ],
};
