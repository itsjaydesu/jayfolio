/* eslint-disable @next/next/no-head-element */
import React from 'react';

function SectionHeading({ children }) {
  return (
    <h1
      style={{
        margin: '0 0 16px',
        fontSize: '28px',
        lineHeight: '1.25',
        color: '#E8F0F6',
        letterSpacing: '0.02em',
        textAlign: 'left'
      }}
    >
      {children}
    </h1>
  );
}

function Paragraph({ children }) {
  return (
    <p
      style={{
        margin: '0 0 18px',
        fontSize: '16px',
        lineHeight: '1.7',
        color: 'rgba(220, 235, 244, 0.88)',
        letterSpacing: '0.01em',
        textAlign: 'left'
      }}
    >
      {children}
    </p>
  );
}

function PlaylistLink({ href, title, description }) {
  return (
    <a
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'linear-gradient(135deg, rgba(20, 92, 122, 0.86), rgba(8, 32, 44, 0.94))',
        padding: '18px 20px',
        borderRadius: '16px',
        marginBottom: '14px',
        border: '1px solid rgba(138, 248, 255, 0.22)',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.32)'
      }}
    >
      <div
        style={{
          fontSize: '17px',
          fontWeight: 600,
          letterSpacing: '0.03em',
          color: 'rgba(164, 236, 255, 0.94)',
          marginBottom: '6px'
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'rgba(210, 230, 240, 0.78)',
          letterSpacing: '0.01em'
        }}
      >
        {description}
      </div>
    </a>
  );
}

export default function SubscriptionConfirmation({ subscriberEmail = '' }) {
  const preheader = `You’re officially on the list. Expect rare transmissions and carefully curated playlists.`;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>You’re on the list!</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#030915',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          color: '#E8F0F6'
        }}
      >
        <div
          style={{
            display: 'none',
            visibility: 'hidden',
            overflow: 'hidden',
            opacity: 0,
            fontSize: '1px',
            lineHeight: '1px',
            maxHeight: 0,
            maxWidth: 0
          }}
        >
          {preheader}
        </div>
        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          style={{
            background: 'radial-gradient(circle at 20% 20%, rgba(24, 120, 160, 0.24), transparent 70%)',
            padding: '40px 0'
          }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: '0 16px' }}>
                <table
                  role="presentation"
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={{
                    maxWidth: '560px',
                    background: 'linear-gradient(160deg, rgba(5, 20, 32, 0.94), rgba(7, 28, 42, 0.88))',
                    borderRadius: '24px',
                    border: '1px solid rgba(110, 180, 210, 0.26)',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.36)',
                    overflow: 'hidden'
                  }}
                >
                  <tbody>
                    <tr>
                      <td
                        style={{
                          padding: '36px 36px 8px',
                          background: 'linear-gradient(150deg, rgba(9, 38, 54, 0.8), rgba(4, 16, 24, 0.8))'
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            borderRadius: '999px',
                            background: 'rgba(26, 82, 108, 0.42)',
                            color: 'rgba(164, 236, 255, 0.92)',
                            fontSize: '12px',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            marginBottom: '18px'
                          }}
                        >
                          Transmission confirmed
                        </div>
                        <SectionHeading>Hi! You’re on the list.</SectionHeading>
                        <Paragraph>
                          Thanks for subscribing{subscriberEmail ? `, ${subscriberEmail}` : ''}. You’ll hear from me when there’s
                          something worth your headphones—no spam, just thoughtful drops.
                        </Paragraph>
                        <Paragraph>
                          While you’re waiting, cue up a few playlists I’ve been looping. They’re designed for deep work,
                          dreamy evenings, and moments of technicolor inspiration.
                        </Paragraph>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0 36px 36px' }}>
                        <PlaylistLink
                          href="https://open.spotify.com/playlist/37i9dQZF1DX8FQ7ZVQ12Z1"
                          title="✨ Night Coding Neon"
                          description="Downtempo synths and future beats for when you want to build with a glow."
                        />
                        <PlaylistLink
                          href="https://open.spotify.com/playlist/37i9dQZF1DX3YSRoSdA634"
                          title="🌙 Soft Focus, Sharp Ideas"
                          description="Gentle piano, strings, and ambient textures to keep the thinking parts humming."
                        />
                        <PlaylistLink
                          href="https://open.spotify.com/playlist/37i9dQZF1DWSXBu5naYCM9"
                          title="🚀 Cosmic Daydreams"
                          description="An eclectic mix of interstellar jazz, electronic curios, and warm analog surprises."
                        />
                        <Paragraph>
                          Feel free to hit reply and tell me what you’re making. I read everything.
                        </Paragraph>
                        <Paragraph>
                          — Jay
                        </Paragraph>
                        <div
                          style={{
                            marginTop: '32px',
                            paddingTop: '18px',
                            borderTop: '1px solid rgba(110, 180, 210, 0.16)',
                            fontSize: '12px',
                            color: 'rgba(170, 200, 214, 0.58)',
                            lineHeight: '1.6'
                          }}
                        >
                          You’re receiving this email because you subscribed at jay.fyi. If you’d rather not get these updates,
                          you can reply with “unsubscribe” and I’ll take care of it.
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

