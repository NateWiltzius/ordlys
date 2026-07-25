import { ImageResponse } from 'next/og';

export const alt = 'Ordlys spaced repetition flashcards for any subject';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(135deg, #071a2f 0%, #123f5d 55%, #0f766e 100%)',
          color: 'white',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          padding: '72px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '980px' }}>
          <div style={{ color: '#99f6e4', display: 'flex', fontSize: 30, fontWeight: 700 }}>
            ORDLYS
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '-3px',
              lineHeight: 1.08,
              marginTop: 26,
            }}
          >
            Learn cards today. Remember them tomorrow.
          </div>
          <div style={{ color: '#dbeafe', display: 'flex', fontSize: 31, marginTop: 28 }}>
            Active recall and spaced repetition for any subject
          </div>
        </div>
      </div>
    ),
    size,
  );
}
