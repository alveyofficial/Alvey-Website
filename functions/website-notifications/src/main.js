export default async ({ req, res, log, error }) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      error('DISCORD_WEBHOOK_URL is not configured');
      return res.json(
        { success: false, error: 'Discord webhook is not configured' },
        500
      );
    }

    let data = {};

    try {
      data = req.bodyJson ?? JSON.parse(req.body || '{}');
    } catch {
      data = {};
    }

    const type = data.type || 'unknown';

    const messages = {
      tutor_application: '🎓 **New Tutor Application**',
      recruitment_application: '👥 **New Recruitment Application**',
      contact_message: '📩 **New Contact Message**',
    };

    const title = messages[type] || '🌐 **New Website Notification**';

    const fields = Object.entries(data)
      .filter(([key]) => key !== 'type')
      .slice(0, 10)
      .map(([key, value]) => ({
        name: key,
        value: String(value ?? 'N/A').slice(0, 1024),
        inline: false,
      }));

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'Alvey Website',
        embeds: [
          {
            title,
            fields,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!discordResponse.ok) {
      const text = await discordResponse.text();
      error(`Discord webhook failed: ${discordResponse.status} ${text}`);

      return res.json(
        { success: false, error: 'Failed to send Discord notification' },
        500
      );
    }

    log(`Discord notification sent: ${type}`);

    return res.json({ success: true });
  } catch (err) {
    error(`Notification error: ${err.message}`);

    return res.json({ success: false, error: 'Internal server error' }, 500);
  }
};
