/**
 * Host-based routing for personal planner pages.
 * angelyn.notbadlah.com/ serves the static page at /angelyn/,
 * sally.notbadlah.com/ serves the static page at /sally/.
 * Every other host and path passes straight through.
 * Paired with public/_routes.json so this only runs on "/" and /api/*.
 */
const HOSTS = {
  'angelyn.notbadlah.com': '/angelyn/',
  'sally.notbadlah.com': '/sally/',
};

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = HOSTS[url.hostname];
  if (target && (url.pathname === '/' || url.pathname === '/index.html')) {
    url.pathname = target;
    return context.env.ASSETS.fetch(new Request(url.toString(), context.request));
  }
  return context.next();
}
