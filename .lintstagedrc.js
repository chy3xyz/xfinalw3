// Biome check and format for all supported files
const biomeCheckCommand = (filenames) =>
  `bun biome check --write --no-errors-on-unmatched --files-ignore-unknown=true ${filenames.join(" ")}`

module.exports = {
  // Biome handles formatting and linting for most files (incl. Svelte)
  "*.{js,jsx,ts,tsx,svelte,json,css,md}": [biomeCheckCommand],
  // Foundry: use forge fmt for Solidity files
  "packages/foundry/**/*.sol": [
    (filenames) => `bun foundry:format ${filenames.join(" ")}`
  ]
}
