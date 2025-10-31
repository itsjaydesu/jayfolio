import { NextResponse } from 'next/server';
import SubscriptionConfirmation from '../../../lib/emails/SubscriptionConfirmation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function isValidEmail(value) {
  return EMAIL_PATTERN.test((value || '').trim());
}

function extractErrorMessage(errorPayload) {
  if (!errorPayload) {
    return null;
}

  if (typeof errorPayload === 'string') {
    return errorPayload;
  }

  if (errorPayload.message && typeof errorPayload.message === 'string') {
    return errorPayload.message;
  }

  if (Array.isArray(errorPayload.errors) && errorPayload.errors.length) {
    const firstMessage = errorPayload.errors.find((item) => typeof item?.message === 'string');
    if (firstMessage?.message) {
      return firstMessage.message;
    }
  }

  return null;
}

function buildPlainTextEmail(subscriberEmail) {
  const greeting = subscriberEmail ? `Hi ${subscriberEmail},` : 'Hi there,';

  return [
    greeting,
    '',
    "You're officially on the list. Thanks for subscribing!",
    "While you wait for the next drop, queue up a few playlists I've been loving:",
    '',
    '✨ Night Coding Neon – Downtempo synths and future beats for a neon-lit focus session.',
    '🌙 Soft Focus, Sharp Ideas – Gentle piano, strings, and ambient textures for thoughtful work.',
    '🚀 Cosmic Daydreams – Jazz, electronic curios, and warm analog surprises for creative wandering.',
    '',
    'Reply and tell me what you’re making—I read every note.',
    '',
    '— Jay',
    '',
    "You’re receiving this message because you signed up at jay.fyi. Reply with 'unsubscribe' to opt out."
  ].join('\n');
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, message: 'Enter a valid email address.' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error('Missing RESEND_API_KEY environment variable.');
    return NextResponse.json(
      {
        success: false,
        message: 'Email is temporarily unavailable. Please try again later.'
      },
      { status: 500 }
    );
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL;

  if (!fromAddress) {
    console.error('Missing RESEND_FROM_EMAIL environment variable.');
    return NextResponse.json(
      {
        success: false,
        message: 'Email is temporarily unavailable. Please try again later.'
      },
      { status: 500 }
    );
  }

  const { renderToStaticMarkup } = await import('react-dom/server');
  const emailMarkup = renderToStaticMarkup(<SubscriptionConfirmation subscriberEmail={email} />);
  const html = emailMarkup.startsWith('<!DOCTYPE html>') ? emailMarkup : `<!DOCTYPE html>${emailMarkup}`;
  const text = buildPlainTextEmail(email);

  let response;

  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: "You're on the list!",
        html,
        text
      })
    });
  } catch (error) {
    console.error('Failed to reach Resend API', error);
    return NextResponse.json(
      {
        success: false,
        message: 'We could not reach the email service. Please try again soon.'
      },
      { status: 502 }
    );
  }

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => null);
    const errorMessage =
      extractErrorMessage(errorDetails) ||
      "We couldn't send the confirmation email right now. Please try again soon.";

    console.error('Failed to send subscription email', {
      status: response.status,
      error: errorDetails || null
    });

    return NextResponse.json(
      {
        success: false,
        message: errorMessage
      },
      { status: response.status === 401 || response.status === 403 ? 401 : 502 }
    );
  }

  return NextResponse.json({ success: true, message: "You're on the list. Thanks for tuning in." });
}

