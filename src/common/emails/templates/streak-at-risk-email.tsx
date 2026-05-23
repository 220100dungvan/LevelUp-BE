import envConfig from '@/common/utils/config'
import * as React from 'react'

interface StreakAtRiskEmailProps {
  name: string
  streak: number
}

export default function StreakAtRiskEmail({ name, streak }: StreakAtRiskEmailProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#ffffff', padding: '40px 0' }}>
          <tr>
            <td align="center">
              <table
                width="480"
                cellPadding={0}
                cellSpacing={0}
                style={{ backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden' }}
              >
                {/* Header cam */}
                <tr>
                  <td style={{ backgroundColor: '#45B3DF', padding: '24px 32px', textAlign: 'center' }}>
                    <div style={{ fontSize: 48 }}>🔥</div>

                    <img
                      src="https://res.cloudinary.com/dcmpyg8ih/image/upload/v1779578210/panda_k3avhn.svg"
                      alt=""
                      style={{
                        width: '100px',
                      }}
                    />
                  </td>
                </tr>

                {/* Body */}

                <tr>
                  <td style={{ padding: '20px 32px 10px', textAlign: 'center' }}>
                    <p style={{ color: '#000000', fontSize: 14, fontWeight: 600 }}>
                      STREAK HIỆN TẠI:{' '}
                      <span style={{ color: '#ff8800', fontSize: 14, fontWeight: 600 }}>{streak}</span>{' '}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '32px 32px 24px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Học đi {name} ơi!</p>
                    <p style={{ margin: '12px 0 0', fontSize: 15, color: '#6b7280', lineHeight: 1.6 }}>
                      Bạn chưa học hôm nay. Chỉ cần <strong>3 phút</strong> thôi là streak {streak} ngày của bạn được
                      giữ nguyên nhé!
                    </p>
                  </td>
                </tr>

                {/* CTA */}
                <tr>
                  <td style={{ padding: '0 32px 32px', textAlign: 'center' }}>
                    <a
                      href={envConfig.FRONTEND_URL ?? '#'}
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
                      HỌC NGAY
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
