// Minimal root layout. The actual app is served as a static file from
// public/index.html via the `/` rewrite in next.config.js. Anything you
// add under app/ (e.g. an admin dashboard later) will use this layout.

export const metadata = {
  title: 'StyleSync',
  description: 'Your wardrobe, softer.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
