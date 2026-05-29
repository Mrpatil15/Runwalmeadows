/**
 * ═══════════════════════════════════════════════════════════════
 *  RUNWAL MEADOWS – Lead Generation Backend
 *  Agency : Heawen Property  |  heawen@runwalmeadows.info
 *  Stack  : Node.js + Express + Nodemailer
 * ═══════════════════════════════════════════════════════════════
 *  Endpoints:
 *   POST /api/submit-lead   → save lead + send email
 *   GET  /leads?key=ADMIN   → view all leads (HTML table)
 *   GET  /                  → serves the website
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Lead storage file ─────────────────────────────────────────
const LEADS_FILE = path.join(__dirname, 'leads.json');
if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, '[]');

// Thread-safe async queue to prevent file-write collisions
let writeQueue = Promise.resolve();

async function saveLead(lead) {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue.then(async () => {
      try {
        const content = await fs.promises.readFile(LEADS_FILE, 'utf8');
        const leads = JSON.parse(content || '[]');
        leads.unshift(lead); // newest first
        await fs.promises.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));
        resolve(leads.length);
      } catch (err) {
        reject(err);
      }
    });
  });
}

// ── Email transporter ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host   : process.env.SMTP_HOST || 'smtp.gmail.com',
  port   : parseInt(process.env.SMTP_PORT) || 587,
  secure : false,
  auth   : {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: { rejectUnauthorized: false }
});

// ── Email HTML template ───────────────────────────────────────
function buildEmailHTML(lead, totalLeads) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.1);">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0a0d14,#181e2e);padding:28px 32px;text-align:center;">
        <div style="color:#c9a84c;font-size:12px;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px;">Heawen Property</div>
        <div style="color:#ffffff;font-size:22px;font-weight:bold;">🏠 New Lead Received</div>
        <div style="color:rgba(201,168,76,0.8);font-size:13px;margin-top:6px;">Runwal Meadows – Kanjurmarg East</div>
      </td></tr>

      <!-- Lead Details -->
      <tr><td style="padding:30px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Name</span><br>
              <span style="color:#222;font-size:18px;font-weight:bold;margin-top:4px;display:block;">${lead.name}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Phone Number</span><br>
              <span style="color:#c9a84c;font-size:20px;font-weight:bold;margin-top:4px;display:block;">
                <a href="tel:${lead.phone}" style="color:#c9a84c;text-decoration:none;">📞 ${lead.phone}</a>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Location</span><br>
              <span style="color:#222;font-size:15px;margin-top:4px;display:block;">📍 ${lead.location || 'Not provided'}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
              <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Lead Source</span><br>
              <span style="color:#222;font-size:14px;margin-top:4px;display:block;">🔗 ${lead.source}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Submitted At</span><br>
              <span style="color:#222;font-size:13px;margin-top:4px;display:block;">🕐 ${lead.timestamp}</span>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:0 32px 24px;">
        <a href="tel:${lead.phone}" style="display:block;background:linear-gradient(135deg,#c9a84c,#9a7a2e);color:#0a0d14;text-decoration:none;text-align:center;padding:14px;border-radius:6px;font-weight:bold;font-size:15px;letter-spacing:1px;">
          📞 CALL ${lead.phone} NOW
        </a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8f8f8;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
        <span style="color:#aaa;font-size:11px;">Lead #${totalLeads} · Runwal Meadows Lead Portal · Heawen Property</span>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
//  POST /api/submit-lead
// ═══════════════════════════════════════════════════════════════
app.post('/api/submit-lead', async (req, res) => {
  const { name, phone, location, email, source } = req.body;

  // Basic validation
  if (!name || !name.trim()) return res.status(400).json({ ok: false, msg: 'Name is required' });
  if (!phone || phone.replace(/\D/g,'').length < 10) return res.status(400).json({ ok: false, msg: 'Valid phone required' });

  const lead = {
    id        : Date.now(),
    name      : name.trim(),
    phone     : phone.trim(),
    location  : (location || '').trim() || 'Not provided',
    email     : (email || '').trim() || 'Not provided',
    source    : source || 'website',
    timestamp : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    createdAt : new Date().toISOString()
  };

  // 1. Save to leads.json
  // 1. Save to leads.json
  let totalLeads;
  try {
    totalLeads = await saveLead(lead);
  } catch (err) {
    console.error('❌ Failed to save lead:', err.message);
    return res.status(500).json({ ok: false, msg: 'Failed to save lead' });
  }
  console.log(`✅ Lead #${totalLeads}: ${lead.name} | ${lead.phone} | ${lead.location}`);

  // 2. Send email (non-blocking — respond to client immediately)
  res.json({ ok: true, msg: 'Lead received successfully' });

  // Send email after responding
  try {
    await transporter.sendMail({
      from    : `"${process.env.FROM_NAME || 'Runwal Meadows'}" <${process.env.SMTP_USER}>`,
      to      : process.env.LEAD_EMAIL || 'heawenproperty7@gmail.com',
      subject : `🏠 New Lead – Runwal Meadows | ${lead.name} | ${lead.phone}`,
      html    : buildEmailHTML(lead, totalLeads)
    });
    console.log(`📧 Email sent for lead: ${lead.name}`);
  } catch (err) {
    console.error('❌ Email failed:', err.message);
    // Lead is already saved — email failure doesn't lose the lead
  }
});

// ═══════════════════════════════════════════════════════════════
//  GET /leads?key=ADMIN_KEY  — View all leads dashboard
// ═══════════════════════════════════════════════════════════════
app.get('/leads', async (req, res) => {
  const { key } = req.query;
  if (key !== (process.env.ADMIN_KEY || 'heawen2024')) {
    return res.status(401).send('<h2>Unauthorized. Add ?key=YOUR_ADMIN_KEY to the URL</h2>');
  }

  try {
    const content = await fs.promises.readFile(LEADS_FILE, 'utf8');
    const leads = JSON.parse(content || '[]');
    const rows  = leads.map((l, i) => `
      <tr style="background:${i%2===0?'#fff':'#fafafa'}">
        <td style="padding:10px 14px;color:#888;font-size:12px">${leads.length - i}</td>
        <td style="padding:10px 14px;font-weight:600">${l.name}</td>
        <td style="padding:10px 14px"><a href="tel:${l.phone}" style="color:#c9a84c;font-weight:700">${l.phone}</a></td>
        <td style="padding:10px 14px">${l.location}</td>
        <td style="padding:10px 14px;font-size:12px;color:#888">${l.source}</td>
        <td style="padding:10px 14px;font-size:12px;color:#888">${l.timestamp}</td>
      </tr>`).join('');

    res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Leads – Runwal Meadows</title>
<style>
  body{margin:0;font-family:Arial,sans-serif;background:#f0f2f5}
  .hdr{background:linear-gradient(135deg,#0a0d14,#181e2e);color:#fff;padding:20px 32px;display:flex;align-items:center;gap:16px}
  .hdr h1{margin:0;font-size:20px}.hdr span{color:#c9a84c;font-size:13px}
  .wrap{padding:24px 32px}
  .stat{display:inline-block;background:#fff;border-radius:8px;padding:14px 24px;margin:0 8px 16px 0;box-shadow:0 1px 4px rgba(0,0,0,.1)}
  .stat .n{font-size:28px;font-weight:700;color:#c9a84c}.stat .l{font-size:12px;color:#888}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)}
  thead{background:#0a0d14;color:#c9a84c} thead th{padding:12px 14px;text-align:left;font-size:12px;letter-spacing:1px;text-transform:uppercase}
  a{color:#c9a84c}
</style></head><body>
<div class="hdr"><div><h1>🏠 Runwal Meadows – Leads Dashboard</h1><span>Heawen Property · heawen@runwalmeadows.info</span></div></div>
<div class="wrap">
  <div class="stat"><div class="n">${leads.length}</div><div class="l">Total Leads</div></div>
  <div class="stat"><div class="n">${leads.filter(l=>l.createdAt && l.createdAt.startsWith(new Date().toISOString().slice(0,10))).length}</div><div class="l">Today</div></div>
  <table>
    <thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Location</th><th>Source</th><th>Time</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:40px;color:#aaa">No leads yet</td></tr>'}</tbody>
  </table>
</div></body></html>`);
  } catch (err) {
    console.error('❌ Failed to read leads:', err.message);
    res.status(500).send('<h2>Internal Server Error</h2>');
  }
});

// ── Fallback: serve index.html for all other routes ───────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   RUNWAL MEADOWS – Lead Server Running   ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log(`  🌐 Website  : http://localhost:${PORT}`);
  console.log(`  📊 Leads    : http://localhost:${PORT}/leads?key=${process.env.ADMIN_KEY || 'heawen2024'}`);
  console.log(`  📧 Sending to: ${process.env.LEAD_EMAIL || 'heawen@runwalmeadows.info'}`);
  console.log('');
});
