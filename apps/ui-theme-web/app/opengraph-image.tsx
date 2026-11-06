import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt =
  'UI-Theme: dark mode, theme toggles, and transitions for React and Vue';

export const size = { width: 1200, height: 630 };

export const contentType = 'image/png';

export default async function OpengraphImage() {
  const wordmark = await readFile(
    join(process.cwd(), 'public/brand/wordmark-handwritten.svg'),
    'utf8'
  );

  const src = `data:image/svg+xml;base64,${Buffer.from(
    wordmark.replace('#000000', '#ffffff')
  ).toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
        background: '#121212',
        color: '#fcfcfc',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders to PNG; next/image does not apply. */}
      <img src={src} width={760} height={165} alt="" />
      <div
        style={{
          display: 'flex',
          fontSize: 40,
          color: '#a3a3a3',
          textAlign: 'center',
          maxWidth: 960,
        }}
      >
        Dark mode, theme toggles, and transitions for React, Vue, and React
        Native
      </div>
    </div>,
    size
  );
}
