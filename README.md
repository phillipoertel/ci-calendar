# CI Calendar

A calendar for Contact Improvisation events in the Copenhagen area, displayed on [danceshare.dk](https://danceshare.dk).

## How it works

1. Events are maintained by hand in a [Google Calendar](https://calendar.google.com).
2. A WordPress plugin (`wp/ci-calendar/`) fetches the calendar via its public iCal URL, parses the events, and renders them on the page.
3. The plugin is activated via the `[ci-calendar]` shortcode in any WordPress page or post.

## WordPress plugin

The plugin consists of:

- `ci-calendar.php` — registers the shortcode, fetches the iCal feed server-side, and injects the HTML/CSS/JS.
- `ci-calendar.html` — the page markup (tab nav, modals).
- `ci-calendar.js` — parses the iCal data and renders event cards with three views: Weekly (recurring), Other (non-recurring), and All.
- `ci-calendar.css` — all styling.

## Local development

The `wp/` subfolder contains a Docker setup for running WordPress locally:

```
cd wp
docker compose up
```

- If you're lucky, you'll now have a wordpress installation running at http://localhost:8080/ ;-) 
- Then use a wordpress plugin like Duplicator to clone the site you want to work on to your local docker setup.