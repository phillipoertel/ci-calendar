// This is to be set up as a CloudFlare worker (free) in order 
// to have a free and reliable CORS proxy to fetch the calendar data from Google Calendar, which doesn't support CORS.
export default {
  async fetch(request) {
    const url = new URL(request.url).searchParams.get('url');
    const res = await fetch(url);
    const text = await res.text();
    return new Response(text, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/calendar',
      }
    });
  }
}