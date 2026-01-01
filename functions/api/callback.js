export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const code = searchParams.get('code');

  if (!code) return new Response("No code provided", { status: 400 });

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: context.env.DISCORD_CLIENT_ID,
      client_secret: context.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://skids.smelly.cc/api/auth/callback',
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const tokens = await tokenResponse.json();

  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userData = await userResponse.json();

  const user = await context.env.DB.prepare(
    "SELECT * FROM whitelist WHERE discord_id = ? AND is_active = 1"
  ).bind(userData.id).first();

  const status = user ? `authorized=true&expiry=${user.expiry_date}` : "authorized=false";
  return Response.redirect(`https://skids.smelly.cc/?${status}&user=${userData.username}`);
}
