// Biome check and format for all supported files
const biomeCheckCommand = (filenames) =>
  `bun biome check --write ${filenames.join(" ")}`;

module.exports = {
  // Biome handles formatting and linting for most files
  "*.{js,jsx,ts,tsx,json,css,md}": [biomeCheckCommand],
  // Foundry: use forge fmt for Solidity files
  "packages/foundry/**/*.sol": [
    (filenames) => `bun foundry:format ${filenames.join(" ")}`,
  ],
};
