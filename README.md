This is a Wordpress plugin which renders Contact Improvisation events from a Google Calendar, currently embedded on [danceshare.dk](https://danceshare.dk).

# How it works

1. Events are maintained by hand in this public [Google Calendar](https://calendar.google.com/calendar/embed?src=7cd67ecc1e05891f0a89b08a145dca65102fb64fa16b18e4385f89895d2ac18f%40group.calendar.google.com&ctz=Europe%2FBerlin).
2. this WordPress plugin fetches the calendar via its public iCal URL, parses the events, and renders them on the page. 
3. The plugin is activated via the `[ci-calendar]` shortcode in any WordPress page or post.

# WordPress plugin structure

The plugin code lives in `wp/ci-calendar` and consists of:

- `ci-calendar.php` — registers the shortcode, fetches the iCal feed server-side, and injects the HTML/CSS/JS.
- `ci-calendar.html` — the page markup (tab nav, modals).
- `ci-calendar.js` — parses the iCal data and renders event cards with three views: Weekly (recurring), Other (non-recurring), and All.
- `ci-calendar.css` — all styling.

# How to develop the plugin locally

The `wp/` subfolder contains a Docker setup for running WordPress locally:

```
cd wp
docker compose up
```

- If you're lucky, you'll now have a wordpress installation running at http://localhost:8080/ ;-) 
- Then use a wordpress plugin like Duplicator to clone the site you want to work on into your local docker setup.

# Editing Google Calendar events

### Previewing

All calendar changes go live immediately, so just change and save and event and reload the page which embeds the plugin.

How the fields of a Google Calendar event are used by the plugin (see `ci-calendar.js`):

### Title (event summary) 

Taken from `SUMMARY` and shown as the card headline. Keep it short, since the location is appended after it automatically.

### Description

Taken from `DESCRIPTION` and injected as **raw HTML** into the card (`event-desc`), which is what Google Calendar's rich-text editor produces. To keep the calendar clean, it's best use minimal formatting only (maybe only italics). Because it is not escaped, only trusted people should edit the calendar.

### Event link

The *first* `http(s)://` URL found anywhere in the description becomes the event's link. Put the URL on its own line at the end of the description.

### Location

Comes from the event's `LOCATION` field. When editing an event, start with the venue name ("Forsøgsstationen") and use the autocomplete dropdown, so Google stores a fully qualified  address. Otherwise the map link might go elsewhere (or nowhere). 

The label shown depends on where the event is:
  - Copenhagen events (location contains "copenhagen", "københavn" or "kopenhagen" — or has no location at all) show the **venue name**, i.e. the part before the first comma.
  - Non-Copenhagen events show the **city**: the second-to-last comma-separated part of the autocompleted address (or the last part when there are only two), with any leading street numbers stripped.
  - A country suffix is appended when the address names a European country, e.g. `Berlin (DE)`. The mapping lives in `country-codes.js` and matches English, German and Danish country names. Denmark is deliberately excluded, so Danish events outside Copenhagen show just the city.

### Weekly recurring vs "Other" events

An event is treated as weekly by the presence of an `RRULE` (repetition rule) in the iCal feed, i.e. whether "Repeat" was set in Google Calendar. The **weekly** tab shows each recurring series once (deduplicated by `UID`, sorted Mon–Sun), **other** shows only non-recurring events, and **all** shows every expanded occurrence grouped by month.

The `RRULE` is parsed into its parts (`FREQ`, `INTERVAL`, `BYDAY`, `BYMONTHDAY`) and turned into human text like "Every Tuesday", "Monthly on the 2nd Sunday", "Every 2 weeks on Monday".

Occurrences are expanded client-side from the series start, from 3 months in the past to 1 year ahead, capped at 200 per series. Only `FREQ` and `INTERVAL` drive the expansion — `BYDAY` lists, `COUNT`, `UNTIL` and cancelled/moved single occurrences (`EXDATE`, `RECURRENCE-ID`) are **not** honoured, so an exception edited in Google Calendar will still show at its original slot.

### Dates and times

All-day events show "All day".

An event spanning several days is marked multi-day and shows a date range (the iCal exclusive end date is decremented by one day for display). 

Times with a `Z` suffix are treated as UTC and rendered in the visitor's local timezone; other times are read as local wall-clock. 

**Past events**: anything whose end (or start, if there is no end) is before today is hidden from all views.

**Feed**: the calendar is public and read via its iCal URL (`.../public/basic.ics`), fetched server-side on each page render with no caching layer of its own. Only events present in that feed appear; the feed's own horizon limits how far ahead single events show up.
