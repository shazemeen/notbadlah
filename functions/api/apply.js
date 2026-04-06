/**
 * POST /api/apply
 * Receives lead form submissions and stores them in D1 + emails Charles via Resend.
 *
 * Cloudflare Pages env vars required:
 *   NOTBADLAH_DB  — D1 database binding (set in Cloudflare Pages dashboard)
 *   RESEND_API_KEY — Resend.com API key (same one used on shazemeen.com)
 *   NOTIFY_EMAIL   — Email to notify (default: shazemeen@gmail.com)
 */

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { name, phone, email, occupation, hours_available } = body;

    // Basic validation
    if (!name || !phone || !email) {
      return new Response(JSON.stringify({ error: 'Name, phone, and email are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const submittedAt = new Date().toISOString();

    // Store in D1
    if (env.NOTBADLAH_DB) {
      await env.NOTBADLAH_DB.prepare(`
        INSERT INTO leads (name, phone, email, occupation, hours_available, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(name, phone, email, occupation || '', hours_available || '', submittedAt).run();
    }

    // Send email notification via Resend
    if (env.RESEND_API_KEY) {
      const notifyTo = env.NOTIFY_EMAIL || 'shazemeen@gmail.com';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'notbadlah.com <noreply@shazemeen.com>',
          to: notifyTo,
          subject: `New Lead: ${name} — notbadlah.com`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
              <h2 style="color:#FFE135;background:#080808;padding:16px;border-radius:8px;">
                New lead from notbadlah.com 🤙
              </h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px;color:#666;width:140px;">Name</td><td style="padding:8px;font-weight:600;">${name}</td></tr>
                <tr><td style="padding:8px;color:#666;">Phone / WA</td><td style="padding:8px;font-weight:600;">${phone}</td></tr>
                <tr><td style="padding:8px;color:#666;">Email</td><td style="padding:8px;font-weight:600;">${email}</td></tr>
                <tr><td style="padding:8px;color:#666;">Occupation</td><td style="padding:8px;">${occupation || '—'}</td></tr>
                <tr><td style="padding:8px;color:#666;">Hours/week</td><td style="padding:8px;">${hours_available || '—'}</td></tr>
                <tr><td style="padding:8px;color:#666;">Submitted</td><td style="padding:8px;">${new Date(submittedAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}</td></tr>
              </table>
              <p style="margin-top:16px;font-size:13px;color:#999;">
                Reach out within 24 hours. Good luck! 🤙
              </p>
            </div>
          `
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Apply form error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
