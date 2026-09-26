// Telegram notification service

export async function sendTelegramNotification(message: string) {
  const token = '8734266809:AAHLMa--CApI_Ssiqpq62jewh0t-QPoSji4';
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID; // Or we can use a hardcoded one once you provide it

  if (!chatId) {
    console.warn('Telegram Chat ID is not configured. Skipping notification.');
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to send Telegram notification:', errorData);
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}
