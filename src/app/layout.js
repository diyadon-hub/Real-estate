import './globals.css';

export const metadata = {
  title: 'Real Estate Dashboard',
  description: 'Private Real Estate Management & Intelligence Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
