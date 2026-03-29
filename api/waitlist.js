const SUPABASE_URL = 'https://hkhzognfqlfznngidlpv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhraHpvZ25mcWxmem5uZ2lkbHB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1OTA1NzAsImV4cCI6MjA4NjE2NjU3MH0.KdrXUtskTsGbEzH6iV05e9MaCcxKM0-KVPmg8goUQF4';

export default async function handler(req, res) {
  // CORS headers — allow petfoundai.com to call this
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Basic validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/waitlist`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          source: 'petfoundai.com',
          signed_up_at: new Date().toISOString(),
        }),
      }
    );

    // 409 = duplicate email (unique constraint) — treat as success
    if (response.ok || response.status === 409) {
      return res.status(200).json({ success: true });
    }

    const error = await response.text();
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to save email' });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
