import * as React from 'react'

interface StreakComebackEmailProps {
  name: string
  daysMissed: number
}

export default function StreakComebackEmail({ name, daysMissed }: StreakComebackEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f9fafb', fontFamily: 'sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#f9fafb', padding: '40px 0' }}>
          <tr>
            <td align="center">
              <table
                width="480"
                cellPadding={0}
                cellSpacing={0}
                style={{ backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden' }}
              >
                {/* Header */}
                <tr>
                  <td style={{ padding: '36px 32px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 64, lineHeight: 1 }}>😢</div>
                  </td>
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: '16px 32px 24px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>
                      Đã lâu rồi chúng tôi không thấy bạn.
                    </p>
                    <p style={{ margin: '12px 0 0', fontSize: 15, color: '#6b7280', lineHeight: 1.6 }}>
                      {name} ơi, bạn đã bỏ lỡ <strong>{daysMissed} ngày</strong> rồi đó. Hãy dành 3 phút cho một bài học
                      ngay hôm nay để lấy lại phong độ nhé!
                    </p>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td style={{ padding: '0 32px 32px', textAlign: 'center' }}>
                    <a
                      href={process.env.NEXT_PUBLIC_APP_URL ?? '#'}
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#45B3DF',
                        color: '#ffffff',
                        fontSize: 15,
                        fontWeight: 700,
                        padding: '14px 36px',
                        borderRadius: 999,
                        textDecoration: 'none',
                        letterSpacing: 0.5,
                      }}
                    >
                      TRỞ LẠI HỌC TẬP
                    </a>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ borderTop: '1px solid #f3f4f6', padding: '16px 32px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                      Bạn nhận được email này vì đã đăng ký nhận nhắc nhở học tập.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}
