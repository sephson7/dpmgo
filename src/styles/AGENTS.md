# Styles rules

- Keep the compliance footer a short dock on a phone: below 480px the brand tagline and the `·` separators are dropped so the legal links pack into two rows, because the footer is the last thing on the screen and every pixel of it is taken from the map.
- Keep the bottom dock in one wrapper, `.bottom-dock`, so the installed app can turn the launcher, the status strip and the footer into a single glass panel and float the launcher over the map; the browser layout keeps the soft bottom margin it needs for Safari's floating toolbar.
- Treat `display-mode: standalone` and `display-mode: fullscreen` as the same installed app in `src/styles/standalone.css`, because webkit bug 264218 made iOS report the Home Screen app as fullscreen from 16.4 until the behaviour was corrected; the browser layout must stay untouched.
- Never add the home indicator inset on top of the browser margin: the installed dock owns the `env(safe-area-inset-bottom)` once, and the browser footer keeps `calc(14px + env(safe-area-inset-bottom))`, so the two never stack into an empty chin.
