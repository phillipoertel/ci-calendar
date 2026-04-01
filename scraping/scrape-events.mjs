import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = join(__dirname, "events.json");
const EVENTS_URL = "https://www.facebook.com/groups/6617502875/events";

async function scrapeEvents() {
  // Launch Chrome using the "Playwright" profile (stored in "Profile 2")
  const profileDir = join(
    process.env.HOME,
    "Library",
    "Application Support",
    "Google",
    "Chrome",
    "Profile 2"
  );
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chrome",
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = await context.newPage();

  try {
    await page.goto(EVENTS_URL, { waitUntil: "networkidle" });

    // Click "See more" repeatedly to load all events
    while (true) {
      const seeMore = await page.$('text=/See more/i');
      if (!seeMore) break;
      await seeMore.click();
      await page.waitForTimeout(2000);
    }

    // Scroll down to ensure everything is loaded
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("End");
      await page.waitForTimeout(1500);
    }

    // Collect all unique event URLs from the listing page
    const eventUrls = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/events/"]');
      const seen = new Set();
      const urls = [];
      for (const link of links) {
        const match = link.href.match(/\/events\/(\d+)/);
        if (!match) continue;
        const eventId = match[1];
        if (seen.has(eventId)) continue;
        seen.add(eventId);
        urls.push(`https://www.facebook.com/events/${eventId}/`);
      }
      return urls;
    });

    console.log(`Found ${eventUrls.length} events, visiting detail pages...`);

    // Visit each event detail page to extract structured data
    const events = [];
    for (const eventUrl of eventUrls) {
      console.log(`  -> ${eventUrl}`);
      await page.goto(eventUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);

      const event = await page.evaluate((url) => {
        // Title: the main heading on the event page
        const headingEl =
          document.querySelector('h1') ||
          document.querySelector('[role="heading"]');
        const title = headingEl ? headingEl.innerText.trim() : "";

        // Date/time: look for the structured date display
        // Facebook typically shows date in a prominent span near the top
        let startDate = "";
        let endDate = "";

        // Find all text nodes that look like date strings
        const allText = document.body.innerText;
        // Match patterns like "Saturday, April 5, 2025 at 2:00 PM – Sunday, April 6, 2025 at 12:00 AM UTC+02"
        const datePattern =
          /(\w+day,\s+\w+\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s*[AP]M)\s*[–—-]\s*(\w+day,\s+\w+\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s*[AP]M(?:\s*\S+)?)/i;
        const singleDatePattern =
          /(\w+day,\s+\w+\s+\d{1,2},\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s*[AP]M(?:\s*\S+)?)/i;

        const rangeMatch = allText.match(datePattern);
        if (rangeMatch) {
          startDate = rangeMatch[1].trim();
          endDate = rangeMatch[2].trim();
        } else {
          const singleMatch = allText.match(singleDatePattern);
          if (singleMatch) {
            startDate = singleMatch[1].trim();
          }
        }

        // If full date pattern didn't match, try shorter formats
        // e.g. "SAT, APR 5 AT 2:00 PM"
        if (!startDate) {
          const shortPattern =
            /(\w{3},\s+\w{3}\s+\d{1,2}\s+AT\s+\d{1,2}:\d{2}\s*[AP]M)\s*[–—-]\s*(\w{3},\s+\w{3}\s+\d{1,2}\s+AT\s+\d{1,2}:\d{2}\s*[AP]M(?:\s*\S+)?)/i;
          const shortSinglePattern =
            /(\w{3},\s+\w{3}\s+\d{1,2}\s+AT\s+\d{1,2}:\d{2}\s*[AP]M(?:\s*\S+)?)/i;

          const shortRange = allText.match(shortPattern);
          if (shortRange) {
            startDate = shortRange[1].trim();
            endDate = shortRange[2].trim();
          } else {
            const shortSingle = allText.match(shortSinglePattern);
            if (shortSingle) {
              startDate = shortSingle[1].trim();
            }
          }
        }

        // Location: the div that is the next sibling of the div containing "Event by"
        let location = "";
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT
        );
        while (walker.nextNode()) {
          if (walker.currentNode.textContent.trim() === "Event by") {
            // Walk up to the containing div
            let eventByDiv = walker.currentNode.parentElement;
            while (eventByDiv && eventByDiv.tagName !== "DIV") {
              eventByDiv = eventByDiv.parentElement;
            }
            if (eventByDiv && eventByDiv.nextElementSibling) {
              location = eventByDiv.nextElementSibling.innerText.trim();
            }
            break;
          }
        }

        return {
          title,
          startDate,
          endDate: endDate || null,
          eventUrl: url,
          location: location || null,
        };
      }, eventUrl);

      events.push(event);
    }

    writeFileSync(OUTPUT_FILE, JSON.stringify(events, null, 2));
    console.log(JSON.stringify(events, null, 2));
    console.log(`\n✓ ${events.length} events saved to ${OUTPUT_FILE}`);
  } finally {
    await page.close();
    await context.close();
  }
}

scrapeEvents().catch((err) => {
  console.error("Scraping failed:", err.message);
  process.exit(1);
});
