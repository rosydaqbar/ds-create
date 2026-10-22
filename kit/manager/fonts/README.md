# Prepared fonts

Inter, Geist, and Plus Jakarta Sans are the prepared choices when a builder has not specified a typeface. A provided brand font or an existing system font takes precedence. The first prepared font is only the browser preview's initial selection, not an init decision.

Normal variable TTF files are bundled locally, with each font's upstream SIL Open Font License beside it. `sources.json` records upstream URLs, Git blob hashes, and SHA256 checksums. Source: the official [Google Fonts repository](https://github.com/google/fonts). No runtime font CDN is required.

These browser font assets do not install fonts into the operating system or Figma. Init must still check the chosen family's available styles through Figma before creating text styles. The TTF files can be installed if needed; do not claim Figma availability from a successful browser preview.
