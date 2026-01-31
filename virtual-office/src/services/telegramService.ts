const PROXY_BASE = 'http://localhost:3001';

export async function sendToTelegram(chatId: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`${PROXY_BASE}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, message }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send to Telegram:', error);
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return false;
  }
}

export async function sendNewsletterPreview(
  chatId: string,
  newsletterId: string,
  previewText: string
): Promise<boolean> {
  const reviewUrl = `${window.location.origin}/review/${newsletterId}`;
  const message = `${previewText}\n\nReview your newsletter here: ${reviewUrl}`;
  return sendToTelegram(chatId, message);
}

export async function sendNewsletterApprovalConfirmation(chatId: string): Promise<boolean> {
  return sendToTelegram(chatId, '✅ Newsletter approved and ready to send!');
}

export async function sendNewsletterRejectionNotification(
  chatId: string,
  feedback: string
): Promise<boolean> {
  return sendToTelegram(
    chatId,
    `📝 Newsletter needs revision.\n\nFeedback: ${feedback}\n\nPlease provide updated details and we'll generate a new version.`
  );
}
