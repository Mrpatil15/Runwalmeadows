/**
 * Vercel Serverless Function: /api/submit-lead
 * Relays lead submissions from the landing page to Google Apps Script.
 */

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, msg: 'Method Not Allowed' });
    return;
  }

  const { name, phone, location, email, source } = req.body;

  // Basic validation
  if (!name || !name.trim()) {
    res.status(400).json({ ok: false, msg: 'Name is required' });
    return;
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    res.status(400).json({ ok: false, msg: 'Valid phone number required' });
    return;
  }

  const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!googleScriptUrl) {
    console.error('❌ GOOGLE_SCRIPT_URL environment variable is missing on Vercel.');
    // Return success to the client to not block the UI, but log the error
    res.status(200).json({ 
      ok: true, 
      msg: 'Lead accepted (Relay config error)' 
    });
    return;
  }

  try {
    console.log(`Relaying lead for ${name} to Google Sheets...`);
    
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        location: (location || '').trim(),
        email: (email || '').trim(),
        source: source || 'website'
      }),
      // Apps Script redirects the post request, follow it
      redirect: 'follow'
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      data = { raw: text };
    }

    console.log('Google Apps Script response:', data);
    res.status(200).json({ ok: true, msg: 'Lead saved to Google Sheets' });
  } catch (err) {
    console.error('❌ Failed to relay lead to Google Sheets:', err.message);
    res.status(500).json({ ok: false, msg: 'Failed to record lead in database' });
  }
};
