// ─── State ─────────────────────────────────────────────────────────────────
let allEvents = [];
let filter    = 'schedule';
const today   = new Date(); today.setHours(0,0,0,0);

// ─── iCal parser ───────────────────────────────────────────────────────────
function unescape(s) {
  return s.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
}

function parseICalDate(valObj) {
  if (!valObj) return null;
  const { val, par } = valObj;

  const allDay = par.includes('VALUE=DATE') || val.length === 8;
  const s = val.replace('Z', '');

  if (allDay) {
    const y = +s.slice(0,4), m = +s.slice(4,6)-1, d = +s.slice(6,8);
    return { date: new Date(y, m, d), allDay: true };
  }
  const y  = +s.slice(0,4),  mo = +s.slice(4,6)-1, d  = +s.slice(6,8);
  const hh = +s.slice(9,11), mm = +s.slice(11,13),  ss = +s.slice(13,15);
  const utc = val.endsWith('Z');
  const date = utc
    ? new Date(Date.UTC(y, mo, d, hh, mm, ss))
    : new Date(y, mo, d, hh, mm, ss);
  return { date, allDay: false };
}

function parseEvent(ev) {
  const start = parseICalDate(ev['DTSTART']);
  if (!start) return null;
  const end   = parseICalDate(ev['DTEND'] || ev['DURATION']);
  const title = unescape((ev['SUMMARY']?.val  || '(No title)'));
  const desc  = unescape((ev['DESCRIPTION']?.val || ''));
  const loc   = unescape((ev['LOCATION']?.val || ''));
  const recur = !!ev['RRULE'];
  const uid   = ev['UID']?.val || '';

  let multiDay = false;
  if (start.allDay && end?.allDay) {
    const diff = (end.date - start.date) / 86400000;
    if (diff > 1) multiDay = true;
  }

  return { start, end, title, desc, loc, recur, uid, multiDay };
}

function parseICal(raw) {
  const text = raw.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = text.split(/\r?\n/);
  const events = [];
  let ev = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { ev = {}; continue; }
    if (line === 'END:VEVENT')   { if (ev) events.push(ev); ev = null; continue; }
    if (!ev) continue;
    const ci = line.indexOf(':');
    if (ci === -1) continue;
    const keyFull = line.slice(0, ci);
    const val     = line.slice(ci + 1);
    const si      = keyFull.indexOf(';');
    const key     = si === -1 ? keyFull : keyFull.slice(0, si);
    const par     = si === -1 ? '' : keyFull.slice(si + 1);
    if (!(key in ev)) ev[key] = { val, par };
    if (key === 'RRULE') ev[key] = { val, par };
  }

  return events.map(raw => {
    const parsed = parseEvent(raw);
    if (!parsed) return null;
    if (raw['RRULE']) parsed._rrule = parseRRuleStr(raw['RRULE'].val);
    return parsed;
  }).filter(Boolean);
}

function parseRRuleStr(str) {
  const parts = {};
  for (const part of str.split(';')) {
    const [k, v] = part.split('=');
    parts[k] = v;
  }
  return parts;
}

// ─── Recurring event expansion ─────────────────────────────────────────────
function expandEvents(events) {
  const rangeStart = new Date(today); rangeStart.setMonth(rangeStart.getMonth() - 3);
  const rangeEnd   = new Date(today); rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);

  const out = [];

  for (const ev of events) {
    if (!ev.recur) { out.push(ev); continue; }

    const rrule = ev._rrule;
    if (!rrule) { out.push(ev); continue; }

    let cursor = new Date(ev.start.date);
    let count  = 0;
    const max  = 200;

    while (cursor <= rangeEnd && count < max) {
      if (cursor >= rangeStart) {
        const dur = ev.end ? ev.end.date - ev.start.date : 0;
        out.push({
          ...ev,
          start: { date: new Date(cursor), allDay: ev.start.allDay },
          end:   ev.end ? { date: new Date(cursor.getTime() + dur), allDay: ev.end.allDay } : null,
        });
      }
      cursor = nextOccurrence(cursor, rrule);
      count++;
    }
  }

  return out.sort((a, b) => a.start.date - b.start.date);
}

function nextOccurrence(date, rule) {
  const d = new Date(date);
  const freq = rule['FREQ'];
  const interval = parseInt(rule['INTERVAL'] || '1', 10);

  if (freq === 'DAILY')        d.setDate(d.getDate() + interval);
  else if (freq === 'WEEKLY')  d.setDate(d.getDate() + 7 * interval);
  else if (freq === 'MONTHLY') d.setMonth(d.getMonth() + interval);
  else if (freq === 'YEARLY')  d.setFullYear(d.getFullYear() + interval);
  else                         d.setDate(d.getDate() + 1);
  return d;
}

// ─── Render ────────────────────────────────────────────────────────────────
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function fmtTime(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtTimeRange(ev) {
  if (ev.start.allDay && ev.multiDay) {
    const endD = new Date(ev.end.date); endD.setDate(endD.getDate() - 1);
    return `${ev.start.date.toLocaleDateString([], {month:'short',day:'numeric'})} – ${endD.toLocaleDateString([], {month:'short',day:'numeric'})}`;
  }
  if (ev.start.allDay) return 'All day';
  const s = fmtTime(ev.start.date);
  if (!ev.end) return s;
  return `${s} – ${fmtTime(ev.end.date)}`;
}

function monthKey(d) { return `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`; }
function monthLabel(d) { return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

function isToday(d) {
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth()    === today.getMonth() &&
         d.getDate()     === today.getDate();
}

function isPast(ev) {
  const ref = ev.end ? ev.end.date : ev.start.date;
  return ref < today;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const clockIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

function renderEvents(events) {
  const main = document.getElementById('ci-calendar-main');
  main.innerHTML = '';

  if (!events.length) {
    main.innerHTML = '<p style="color:var(--muted);text-align:center;padding:3rem 0">No events found.</p>';
    main.style.display = '';
    return;
  }

  const groups = new Map();
  for (const ev of events) {
    const k = monthKey(ev.start.date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(ev);
  }

  for (const [, evs] of groups) {
    const section = document.createElement('section');
    section.className = 'month-group';

    const label = document.createElement('div');
    label.className = 'month-label';
    label.textContent = monthLabel(evs[0].start.date);
    section.appendChild(label);

    for (const ev of evs) section.appendChild(buildCard(ev));
    main.appendChild(section);
  }

  main.style.display = '';
}

function buildCard(ev) {
  const card = document.createElement('div');
  card.className = 'event-card';
  if (isToday(ev.start.date)) card.classList.add('is-today');
  if (ev.multiDay)            card.classList.add('is-multiday');

  const dateCol = document.createElement('div');
  dateCol.className = 'date-col';
  dateCol.innerHTML = `
    <div class="date-day">${ev.start.date.getDate()}</div>
    <div class="date-dow">${DOW[ev.start.date.getDay()]}</div>
  `;

  const infoCol = document.createElement('div');
  infoCol.className = 'info-col';

  const locShort = ev.loc ? ev.loc.split(',')[0].trim() : '';
  const locLink  = ev.loc
    ? ` <a class="event-loc-link" href="https://www.google.com/maps?q=${encodeURIComponent(ev.loc)}" target="_blank" rel="noopener">@ ${escHtml(locShort)}</a>`
    : '';

  const titleEl = document.createElement('div');
  titleEl.className = 'event-title';
  titleEl.innerHTML =
    escHtml(ev.title) + locLink +
    (ev.recur ? '<span class="recurring-badge">↻ recurring</span>' : '') +
    (isToday(ev.start.date) ? '<span class="today-badge">Today</span>' : '');

  const meta = document.createElement('div');
  meta.className = 'event-meta';
  meta.innerHTML = `<span class="meta-chip">${clockIcon} ${fmtTimeRange(ev)}</span>`;

  infoCol.appendChild(titleEl);
  infoCol.appendChild(meta);

  if (ev.desc.trim()) {
    const descEl = document.createElement('div');
    descEl.className = 'event-desc';
    descEl.innerHTML = ev.desc.trim();
    infoCol.appendChild(descEl);
  }

  card.appendChild(dateCol);
  card.appendChild(infoCol);
  return card;
}

// ─── Schedule (deduplicated recurring) view ────────────────────────────────
const BYDAY_NAMES = { MO:'Monday', TU:'Tuesday', WE:'Wednesday', TH:'Thursday', FR:'Friday', SA:'Saturday', SU:'Sunday' };
const ORD = ['','1st','2nd','3rd','4th','5th'];

function rruleToHuman(rrule) {
  if (!rrule) return 'Recurring';
  const freq       = rrule['FREQ'] || '';
  const interval   = parseInt(rrule['INTERVAL'] || '1', 10);
  const byday      = rrule['BYDAY'] || '';
  const bymonthday = rrule['BYMONTHDAY'] || '';

  if (freq === 'DAILY') return interval === 1 ? 'Every day' : `Every ${interval} days`;

  if (freq === 'WEEKLY') {
    if (byday) {
      const days   = byday.split(',').map(d => BYDAY_NAMES[d] || d);
      const joined = days.length === 1 ? days[0] : days.slice(0,-1).join(', ') + ' & ' + days[days.length-1];
      return interval === 1 ? `Every ${joined}` : `Every ${interval} weeks on ${joined}`;
    }
    return interval === 1 ? 'Every week' : `Every ${interval} weeks`;
  }

  if (freq === 'MONTHLY') {
    if (bymonthday) {
      const d = parseInt(bymonthday, 10);
      const suf = d === 1 || d === 21 || d === 31 ? 'st'
                : d === 2 || d === 22 ? 'nd'
                : d === 3 || d === 23 ? 'rd' : 'th';
      return `Monthly on the ${d}${suf}`;
    }
    if (byday) {
      const m = byday.match(/^(-?\d)([A-Z]{2})$/);
      if (m) {
        const n   = parseInt(m[1], 10);
        const day = BYDAY_NAMES[m[2]] || m[2];
        const ord = n === -1 ? 'last' : (ORD[n] || `${n}th`);
        return `Monthly on the ${ord} ${day}`;
      }
    }
    return interval === 1 ? 'Monthly' : `Every ${interval} months`;
  }

  if (freq === 'YEARLY') return 'Yearly';
  return 'Recurring';
}

function renderSchedule(events) {
  const main = document.getElementById('ci-calendar-main');
  main.innerHTML = '';

  const seen = new Set();
  const unique = events.filter(ev => {
    if (!ev.recur || seen.has(ev.uid)) return false;
    seen.add(ev.uid);
    return true;
  });

  unique.sort((a, b) => (a.start.date.getDay() + 6) % 7 - (b.start.date.getDay() + 6) % 7);

  if (!unique.length) {
    main.innerHTML = '<p style="color:var(--muted);text-align:center;padding:3rem 0">No recurring events found.</p>';
    main.style.display = '';
    return;
  }

  for (const ev of unique) {
    const card = document.createElement('div');
    card.className = 'schedule-card';

    const recurCol = document.createElement('div');
    recurCol.className = 'recur-col';
    recurCol.innerHTML = `<span class="recur-icon">↻</span><span class="recur-label">${escHtml(rruleToHuman(ev._rrule))}</span><span class="recur-label">${escHtml(fmtTimeRange(ev))}</span>`;

    const infoCol = document.createElement('div');
    infoCol.className = 'info-col';

    const locShortS = ev.loc ? ev.loc.split(',')[0].trim() : '';
    const locLinkS  = ev.loc
      ? ` <a class="event-loc-link" href="https://www.google.com/maps?q=${encodeURIComponent(ev.loc)}" target="_blank" rel="noopener">@ ${escHtml(locShortS)}</a>`
      : '';

    const titleEl = document.createElement('div');
    titleEl.className = 'event-title';
    titleEl.innerHTML = escHtml(ev.title) + locLinkS;

    infoCol.appendChild(titleEl);

    if (ev.desc.trim()) {
      const descEl = document.createElement('div');
      descEl.className = 'event-desc';
      descEl.innerHTML = ev.desc.trim();
      infoCol.appendChild(descEl);
    }

    card.appendChild(recurCol);
    card.appendChild(infoCol);
    main.appendChild(card);
  }

  main.style.display = '';
}

// ─── Info modal ────────────────────────────────────────────────────────────
const INFO_CONTENT = {
  'send-update': {
    title: 'Suggest a change',
    body: () => {
      const em = ['ci-copenhagen', 'phillipoertel.com'].join('\u0040');
      return `Please send us your updates to <a href="mailto:${em}">${em}</a>. You\u2019re also welcome to help maintain the Google calendar, just write to us.`;
    },
  },
};

function openInfoModal(key) {
  const content = INFO_CONTENT[key];
  if (!content) return;
  document.getElementById('info-modal-title').textContent = content.title;
  const body = typeof content.body === 'function' ? content.body() : content.body;
  document.getElementById('info-modal-body').innerHTML = body;
  document.getElementById('info-modal').classList.add('open');
}

function closeInfoModal(e) {
  if (!e || e.target === document.getElementById('info-modal') || !e.target.closest) {
    document.getElementById('info-modal').classList.remove('open');
  }
}

// ─── Filter / view ─────────────────────────────────────────────────────────
function setFilter(f) {
  filter = f;
  document.getElementById('btn-recurring').classList.toggle('active', f === 'recurring');
  document.getElementById('btn-non-recurring').classList.toggle('active', f === 'non-recurring');
  document.getElementById('btn-schedule').classList.toggle('active', f === 'schedule');
  applyFilter();
}

function applyFilter() {
  const future = allEvents.filter(e => !isPast(e));
  if (filter === 'schedule') {
    renderSchedule(future);
  } else {
    let evs = future;
    if (filter === 'non-recurring') evs = evs.filter(e => !e.recur);
    renderEvents(evs);
  }
}

// ─── Init ──────────────────────────────────────────────────────────────────
function initCalendar(raw) {
  const statusEl = document.getElementById('status');
  const errorEl  = document.getElementById('error-box');

  try {
    allEvents = expandEvents(parseICal(raw));
    const futureEvents = allEvents.filter(e => !isPast(e));
    const nonRecurringCount = futureEvents.filter(e => !e.recur).length;
    const scheduleCount = new Set(futureEvents.filter(e => e.recur).map(e => e.uid)).size;
    document.getElementById('btn-schedule').textContent = `Weekly (${scheduleCount})`;
    document.getElementById('btn-non-recurring').textContent = `Other (${nonRecurringCount})`;
    document.getElementById('btn-recurring').textContent = `All (${futureEvents.length})`;
    statusEl.style.display = 'none';
    applyFilter();
  } catch (err) {
    statusEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.innerHTML = `<strong>Could not load calendar.</strong><br>${escHtml(err.message)}`;
  }
}

// ─── Subscribe modal ───────────────────────────────────────────────────────
const ICAL_URL =
  'https://calendar.google.com/calendar/ical/' +
  '7cd67ecc1e05891f0a89b08a145dca65102fb64fa16b18e4385f89895d2ac18f%40group.calendar.google.com' +
  '/public/basic.ics';

const WEBCAL_URL = ICAL_URL.replace(/^https/, 'webcal');
const CAL_ID     = decodeURIComponent((ICAL_URL.match(/\/ical\/([^/]+)\//) || [])[1] || '');
const GCAL_SUBSCRIBE  = `https://calendar.google.com/calendar/r?cid=${CAL_ID}`;
const OUTLOOK_SUBSCRIBE = `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addsubscription&url=${encodeURIComponent(WEBCAL_URL)}`;

const SUBSCRIBE_LINKS = [
  { label: 'Google Calendar', href: GCAL_SUBSCRIBE },
  { label: 'Apple Calendar',  href: WEBCAL_URL },
  { label: 'Outlook',         href: OUTLOOK_SUBSCRIBE },
];

function openSubscribeModal() {
  const linksEl = document.getElementById('modal-links');
  if (!linksEl.children.length) {
    for (const { label, href } of SUBSCRIBE_LINKS) {
      const a = document.createElement('a');
      a.className = 'modal-btn';
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = label;
      linksEl.appendChild(a);
    }
    const copyBtn = document.createElement('button');
    copyBtn.className = 'modal-btn';
    copyBtn.textContent = 'Copy iCal link';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(WEBCAL_URL).then(() => {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = 'Copy iCal link'; copyBtn.classList.remove('copied'); }, 2000);
      });
    };
    linksEl.appendChild(copyBtn);
  }
  document.getElementById('subscribe-modal').classList.add('open');
}

function closeSubscribeModal(e) {
  if (!e || e.target === document.getElementById('subscribe-modal') || !e.target.closest) {
    document.getElementById('subscribe-modal').classList.remove('open');
  }
}
