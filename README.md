# Beck & Call — Live Site

This folder contains the source for the **beckandcall.co.uk** business website.

## Deployment

The site deploys via GitHub Pages from this directory. The entry point is `index.html`.

- `.nojekyll` is required so GitHub Pages does not try to process the site through Jekyll.
- The `CNAME` file (to be added) tells GitHub Pages which custom domain to serve.

## Development

Single-file site — no build step, no dependencies. Edit `index.html` directly.
To preview locally, open `index.html` in a browser or run any static file server.

## Source

The canonical workshop source lives in the `beck_and_call` repository under `site/`.
When changes are made in the workshop, copy the updated `index.html` here and push.
