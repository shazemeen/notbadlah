/**
 * POST /api/lead
 * Single lead endpoint for all three audiences on notbadlah.com.
 * Accepts a `type` field — "client" | "part_time" | "full_time" — validates
 * and sanitizes the input, writes one row to the unified `leads` D1 table,
 * and sends Charles a Resend notification whose subject includes the type.
 *
 * Cloudflare Pages env / bindings required:
 *   NOTBADLAH_DB   — D1 database binding (one DB for all lead types)
 *   RESEND_API_KEY — Resend.com API key
 *   NOTIFY_EMAIL   — Email to notify (default: shazemeen@gmail.com)
 */

const TYPES = {
  client:    { label: "CLIENT",    title: "client enquiry" },
  part_time: { label: "PART-TIME", title: "part-time application" },
  full_time: { label: "FULL-TIME", title: "full-time application" },
};

// trim + length-cap a string field; non-strings become ''
const clean = (v, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// escape user input before interpolating into the notification HTML
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    // Resolve type — coerce anything unexpected to part_time rather than drop the lead.
    const type = TYPES[body.type] ? body.type : "part_time";

    // Common fields
    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 160);

    // Per-type fields (nullable / blank where not applicable)
    const occupation = clean(body.occupation, 160);
    const hours_available = clean(body.hours_available, 40);
    const job_title = clean(body.job_title, 160);
    const monthly_income = clean(body.monthly_income, 40);
    const pathway = clean(body.pathway, 40);
    const interest = clean(body.interest, 60);
    const preferred_time = clean(body.preferred_time, 40);

    // Validation — name, phone, email are required across every form.
    if (!name || !phone || !email) {
      return json({ error: "Name, phone, and email are required." }, 400);
    }

    const submittedAt = new Date().toISOString();

    // Store in the single unified leads table.
    if (env.NOTBADLAH_DB) {
      await env.NOTBADLAH_DB.prepare(
        `INSERT INTO leads
           (type, name, phone, email, occupation, hours_available,
            job_title, monthly_income, pathway, interest, preferred_time, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          type, name, phone, email, occupation, hours_available,
          job_title, monthly_income, pathway, interest, preferred_time, submittedAt
        )
        .run();
    }

    // Notify Charles via Resend — subject line carries the lead type.
    if (env.RESEND_API_KEY) {
      const notifyTo = env.NOTIFY_EMAIL || "shazemeen@gmail.com";
      const meta = TYPES[type];

      // Field rows shown in the email, by type. Empty values are dropped below.
      const rows = [
        ["Type", meta.label],
        ["Name", name],
        ["Phone / WA", phone],
        ["Email", email],
        ...(type === "part_time"
          ? [["Occupation", occupation], ["Hours/week", hours_available]]
          : []),
        ...(type === "full_time"
          ? [["Job title", job_title], ["Monthly income", monthly_income], ["Pathway", pathway]]
          : []),
        ...(type === "client"
          ? [["Interested in", interest], ["Preferred time", preferred_time]]
          : []),
        [
          "Submitted",
          new Date(submittedAt).toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur" }),
        ],
      ];

      const tableRows = rows
        .filter(([, v]) => v)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px;color:#666;width:140px;">${esc(k)}</td><td style="padding:8px;font-weight:600;">${esc(v)}</td></tr>`
        )
        .join("");

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "notbadlah.com <noreply@shazemeen.com>",
          to: notifyTo,
          subject: `New ${meta.label} enquiry — ${name}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
              <h2 style="color:#FFE135;background:#080808;padding:16px;border-radius:8px;">
                New ${esc(meta.title)} from notbadlah.com 🤙
              </h2>
              <table style="width:100%;border-collapse:collapse;">${tableRows}</table>
              <p style="margin-top:16px;font-size:13px;color:#999;">
                Reach out within 24 hours. Good luck! 🤙
              </p>
            </div>
          `,
        }),
      });
    }

    return json({ success: true }, 200);
  } catch (err) {
    console.error("Lead form error:", err);
    return json({ error: "Internal server error." }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
