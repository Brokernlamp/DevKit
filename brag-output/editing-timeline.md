# DevKit Founder Announcement: Editing Timeline

This is your editing blueprint. Times come from the final composition (`devkit-founder-announcement.mp4`, 38.00 s, 1080x1920, 30 fps).

## Timeline

| Time (s) | Video content | My recording | Audio |
| --- | --- | --- | --- |
| 0.00 to 4.10 (4.10 s) | Hook: "Every new AI agent session" then "starts from zero." | None | Music bed at full level. Soft impact at 1.90 s. Card slide at 3.80 s. |
| 4.10 to 10.38 (6.28 s) | Founder introduction slot. The generated plate is covered by your clip. | **Clip 01** (full frame) | Music ducks to about 0.18 over 4.10 to 4.40 s. Your voice plays on top. |
| 10.38 to 14.20 (3.82 s) | Product reveal: wordmark, tagline, teal rule | None | Bell at 10.38 s. Music rises back over 10.38 to 10.68 s. Card slide at 13.85 s. |
| 14.20 to 24.01 (9.81 s) | Hero: headline. `devkit-ai memory doctor` types from 15.0 s. Output lines appear at 17.9, 18.4, 18.9 and 19.5 s. Caption at 20.4 s. | None | Keypress sounds 15.0 to 17.2 s (12 taps, 0.2 s apart). Click at 17.9, drop at 18.4, click at 18.9 and 19.5 s. Card slide at 23.6 s. |
| 24.01 to 29.00 (4.99 s) | Founder explanation slot. The generated plate is covered by your clip. | **Clip 02** (full frame) | Music ducks to about 0.18 over 24.01 to 24.31 s. Card slide at 28.85 s is a transition after your last word. |
| 29.00 to 34.50 (5.50 s) | Outcome: "Ready to start, in order." Output of `devkit-ai memory next`. Caption at 30.6 s. Scene fades at 34.15 s. | None | Music returns to full over 29.00 to 29.30 s. Click at 29.50 s. |
| 34.50 to 38.00 (3.50 s) | Closing: wordmark (34.5 s), tagline (35.0 s), CTA with GitHub link (35.4 s) | None (see note) | Bell at 34.50 s. Click at 35.40 s. Music fades out from 35.00 to 38.00 s. |

**Note on the closing:** the closing has no spoken clip in the current master. A spoken sign-off would need a music ducking window added to the score first.

## Placement rules

- Your speech in clip 01 must end before **10.00 s**.
- Your speech in clip 02 must end before **28.50 s**. The card slide at 28.85 s comes after your last word.
- Keep one second of silence at the start and end of each clip.

## Editing steps

1. Open your editor and create a new project set to **1080x1920** and **30 fps**.
2. Import the master video `brag-output/devkit-founder-announcement.mp4` and place it on the bottom track at 0 s.
3. Import your recordings `clip-01` and `clip-02`.
4. Put **clip 01** on a track above the master. Start it at **4.10 s**. Trim it to exactly **6.28 s**. If it is shorter, end it early and let the master show through. If it is longer, trim the silence at the start and end.
5. Put **clip 02** on the same track above the master. Start it at **24.01 s**. Trim it to exactly **4.99 s**.
6. Keep the master's audio on. The music is already ducked during your slots, so do not add a second ducking effect.
7. Check the level. Your voice should sit clearly above the music. If it is buried, lower the master's audio by about 3 dB during the slot only.
8. Scrub to 4.10 s, 10.38 s, 24.01 s and 29.00 s to check the cuts.
9. Export as **H.264 MP4**, **1080x1920**, **30 fps**, AAC audio at **48 kHz**.

## Ready-made section files

`brag-output/sections/` holds one cut per part, so you can drop them in directly:

| File | Length | Starts at |
| --- | --- | --- |
| `01-hook.mp4` | 4.10 s | 0.00 s |
| `02-founder-intro-slot.mp4` | 6.30 s | 4.10 s |
| `03-product-reveal.mp4` | 3.83 s | 10.38 s |
| `04-hero-feature.mp4` | 9.83 s | 14.20 s |
| `05-founder-explanation-slot.mp4` | 5.00 s | 24.01 s |
| `06-outcome.mp4` | 5.50 s | 29.00 s |
| `07-closing.mp4` | 3.50 s | 34.50 s |

The file lengths are rounded to the nearest frame. The times in the table above are the source of truth. If the two disagree by a frame, use the table.

## Audio credits

- Music: "Happy Beats - Business Moves Vol. 10" by ende.app, licensed CC BY 4.0. Credit is required when you publish.
- Sound effects: Kenney, CC0. No credit required.
