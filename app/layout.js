export const metadata = {
  title: "MonVault",
  description: "NFT Time Capsules on Monad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
