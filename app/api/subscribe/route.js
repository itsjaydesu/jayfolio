import { NextResponse } from 'next/server';
import { renderToStaticMarkup } from 'react-dom/server';
import SubscriptionConfirmation from '../../../lib/emails/SubscriptionConfirmation';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function isValidEmail(value) {
  return EMAIL_PATTERN.test((value || '').trim());
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

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Jay <updates@jayfolio.com>';
  const emailMarkup = renderToStaticMarkup(<SubscriptionConfirmation subscriberEmail={email} />);
  const html = emailMarkup.startsWith('<!DOCTYPE html>') ? emailMarkup : `<!DOCTYPE html>${emailMarkup}`;

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress,
      to: email,
      subject: "You're on the list!",
      html
    })
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => null);
    console.error('Failed to send subscription email', { status: response.status, error: errorDetails });

    return NextResponse.json(
      {
        success: false,
        message: "We couldn't send the confirmation email right now. Please try again soon."
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, message: "You're on the list. Thanks for tuning in." });
}

