# DevKit Visual Identity: Founder Announcement

This file records the palette, typography, and usage rules for the founder-led announcement video (`devkit-founder-announcement.mp4`, 38 s, 1080x1920).

## Why this palette

DevKit is a local-first command-line tool. It reads project files and tells a developer whether their AI coding agent's memory is healthy. The audience is developers who will install it on their own machines and trust it with their repository, so the visual identity has to read as **trustworthy first, exciting second**.

- **Midnight Navy** carries the trust and stability cue. Dark, quiet backgrounds read as developer tooling and suggest a terminal, not a marketing site.
- **Signal Teal** is the single accent. It stands for clarity and modernity, and it matches the `Dev` / `Kit` split in the wordmark. Teal is also a clear "ok" colour in the terminal output.
- **Amber** is reserved for the one call to action. Amber is an attention colour, so using it only once keeps the CTA the only warm element on screen.
- **Coral** is not a brand colour. It appears only on the `[FAIL]` line, because a red-family colour is the clearest signal for a failed check.

Purple was considered and excluded. Purple signals creativity and premium positioning, but this product is a trust-heavy handoff tool, and a purple accent would make it look like a design or creative product.

## Palette

| Role | Name | HEX | Use |
| --- | --- | --- | --- |
| Background | Midnight Navy | `#0B1426` | All scene backgrounds |
| Panel | Panel Navy | `#121E35` | Terminal and card surfaces |
| Panel header | Deep Panel | `#0F1A2E` | Terminal title bar |
| Line | Slate Line | `#23345A` | Panel borders and dividers |
| Grid | Grid Navy | `#131F38` | Faint background grid |
| Accent (primary) | Signal Teal | `#2DD4BF` | Wordmark `Kit`, prompts, `[PASS]`, rule |
| CTA | Amber | `#F5B53F` | CTA pill only |
| Text (primary) | Paper | `#F4F7FB` | Headlines, wordmark `Dev`, terminal output |
| Text (secondary) | Slate Text | `#9FB0C8` | Taglines, captions, metadata |
| Alert | Coral | `#F87171` | `[FAIL]` line and its left border only |

Three primary colours (Navy, Teal, Amber) plus neutrals (Paper, Slate Text, Panel tones) and one alert colour.

## Contrast (WCAG)

Measured against the Midnight Navy background `#0B1426`:

| Pair | Ratio | Result |
| --- | --- | --- |
| Paper `#F4F7FB` on Navy | 17.11:1 | AAA |
| Amber `#F5B53F` on Navy | 10.12:1 | AAA |
| Teal `#2DD4BF` on Navy | 9.88:1 | AAA |
| Slate Text `#9FB0C8` on Navy | 8.33:1 | AAA |
| Coral `#F87171` on Navy | 6.65:1 | AA |

Dark text on the CTA: `#0B1426` on Amber `#F5B53F` is 10.12:1 (AAA).

## Typography

- **Display and headlines:** `"Helvetica Neue", Helvetica, Arial, sans-serif`. Bold weights for the wordmark and headlines. Hook text is 88 px.
- **Terminal and code:** `"SF Mono", Menlo, Consolas, monospace`. Terminal body is 28 px so it stays legible on a phone.
- Sans-serif display and monospace terminal text match the product: a clean brand voice, with the real command output shown exactly as the CLI prints it.

## Logo and wordmark

- Wordmark: `Dev` in Paper, `Kit` in Signal Teal. This is the existing DevKit wordmark treatment, used unchanged.
- The wordmark is shown on the reveal and closing scenes. In the founder slots, a small corner mark (top-left) appears on the plate.
- The DevKit icon is not used.

## Usage rules

1. Backgrounds are always Midnight Navy. Do not use gradients or neon glows.
2. Teal is the only accent colour for emphasis. Use it for `Kit`, prompts, and passing checks. Do not use it for body text.
3. Amber appears once, on the call-to-action pill. Do not use it for decoration or for other text.
4. Coral appears only on a failing check line. Never use it as a general accent.
5. Headlines use Paper. Secondary text uses Slate Text. Do not place body text on a coloured background.
6. Terminal panels use Panel Navy with a Slate Line border, matching a real terminal window.
7. Transitions are hard cuts or short fades to Midnight Navy. Do not add colour flashes between scenes.
8. Founder clips are shown full-frame on Midnight Navy surroundings. Record against a dark background that matches `#0B1426` so the cut-in and cut-out blend.

## Source

Palette, sizes, and timings come from `brag-output/composition/index.html`. Real CLI output comes from `brag-output/assets/cli-transcript.txt`.
