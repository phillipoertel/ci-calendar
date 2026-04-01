# How this works

1. the list of events is maintained in a Google calendar at ...
2. the file calendar.html has Javascript to fetch the calendar and render it in a simple list
3. in order to load the google calendar file with Javascript, a proxy script is used. this is cloudflare-worker.js, which is hosted at `https://dash.cloudflare.com/b4532d671e9a6172552280b72a11fb60/workers/services/view/corsproxy/production`.
4. in local development, the file index.html can be used to preview the iframe embedding. Start with `python3 -m http.server` and then go to `http://localhost:8000/index.html`.

## Scraping Facebook Events

The `scraping/` folder contains a Playwright script that scrapes upcoming events from the [CI CPH Facebook group](https://www.facebook.com/groups/6617502875/events) using your real Chrome browser (so you're already logged in).

### Setup

```bash
cd scraping
npm install
```

### Usage

The script launches Chrome using the "Playwright" Chrome profile (must be logged into Facebook). Your main Chrome can stay open.

```bash
npm run scrape
```

This will output the scraped events as JSON to the console and save them to `scraping/events.json`.

Each event includes: `title`, `startDate`, `endDate`, `eventUrl`, and `location`.