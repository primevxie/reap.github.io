export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);

    const secret = url.searchParams.get("secret");
    const mySecret = env.BILLGANG_SECRET; 
    
    if (!mySecret || secret !== mySecret) {
      return new Response("Unauthorized: Wrong Secret", { status: 401 });
    }

    const payload = await request.json();
    

    const customFields = payload.custom_fields || {};
    let discordId = customFields.discord_id || payload.discord_id;

    if (discordId) discordId = discordId.toString().trim();

    if (!discordId) {
      return new Response(JSON.stringify({
        error: "Discord ID missing. Make sure the Custom Field is named 'discord_id'."
      }), { status: 400 });
    }

    const date = new Date();
    date.setDate(date.getDate() + 30); 
    const expiryDate = date.toISOString().split('T')[0]; 


    const query = `
      INSERT INTO whitelist (discord_id, username, is_active, expiry_date)
      VALUES (?, 'Billgang Customer', 1, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
      is_active = 1,
      expiry_date = ?
    `;

    await env.DB.prepare(query)
      .bind(discordId, expiryDate, expiryDate)
      .run();

    const deliveryMessage = `
✅ ACTIVATION SUCCESSFUL!

Your Discord ID (${discordId}) has been whitelisted for 30 Days.
Expires: ${expiryDate}

Download the Client: https://skids.smelly.cc/
    `;

    return new Response(JSON.stringify({
      type: "text",
      content: deliveryMessage
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
