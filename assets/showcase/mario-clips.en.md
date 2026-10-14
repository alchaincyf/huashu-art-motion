# Huashu Clears Super Mario · GIF clips

[中文](mario-clips.md) · **English**

Cut directly from the 65.02-second film *Huashu Clears Super Mario*, keeping the CRT look. Only the showcase GIFs are included here, not the level's project files or the full video.

- `mario-claude.gif`: 00:06.30–00:11.80, 5.5 s, 800×450. Membership choice → Claude star → grows.
- `mario-combo.gif`: 00:28.60–00:32.60, 4 s, 640×360. Stomp enemy → kick the shell into a character → smash a brick.
- `mario-pipe.gif`: 00:17.00–00:24.70, 7.7 s, 640×360. Into the pipe → coin room → whip-pan back above ground.

All three run at original speed, 20 fps, silent, looping forever. Each clip gets its own 192-color palette with Bayer dithering to control size, then lossless optimization with `gifsicle -O3`. The loop jumps back to the start when the clip ends; it is not a seamless loop.

Export example (requires ffmpeg and your own source film):

```sh
ffmpeg -ss 6.3 -t 5.5 -i input.mp4 -filter_complex "fps=20,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff:max_colors=192[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -loop 0 mario-claude.gif
```

The Huashu likeness in these GIFs follows the demo-only restriction stated in the repository README.
