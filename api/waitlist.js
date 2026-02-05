export async function POST(request) {
  const { email } = await request.json().catch(() => ({}));

  if (!email || typeof email !== "string") {
    return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const legacyServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = secretKey || legacyServiceKey;

  if (!supabaseUrl || !apiKey) {
    return Response.json({ error: "Server is not configured yet." }, { status: 500 });
  }

  const baseUrl = supabaseUrl.replace(/\/$/, "");

  const payload = {
    email: email.trim().toLowerCase(),
  };

  const headers = {
    "Content-Type": "application/json",
    apikey: apiKey,
    Prefer: "return=minimal",
  };

  if (!apiKey.startsWith("sb_")) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const supabaseResponse = await fetch(`${baseUrl}/rest/v1/waitlist`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!supabaseResponse.ok) {
    const errorText = await supabaseResponse.text();
    let errorMessage = "Unable to join the waitlist. Please try again.";

    try {
      const errorPayload = JSON.parse(errorText);
      if (errorPayload.code === "23505") {
        return Response.json({ ok: true, duplicate: true });
      }
    } catch {
      // Ignore JSON parse errors.
    }

    return Response.json({ error: errorMessage }, { status: 400 });
  }

  return Response.json({ ok: true });
}
