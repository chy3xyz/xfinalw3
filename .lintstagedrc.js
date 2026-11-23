const biomeCheckCommand = (filenames) =>
  `bun biome check --no-errors-on-unmatched --files-ignore-unknown=true --formatter-enabled=false --organize-imports-enabled=false ${filenames.join(" ")}`

module.exports = {
  "*.{js,jsx,ts,tsx,svelte,json,css,md}": [biomeCheckCommand]
}
