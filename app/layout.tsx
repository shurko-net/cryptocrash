import { AppWithProviders } from "~~/components/AppWithProviders";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/getMetadata";

export const metadata = getMetadata({
  title: "CryptoCrash",
  description: "CryptoCrash is a decentralized blockchain game",
});

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <AppWithProviders>{children}</AppWithProviders>
      </body>
    </html>
  );
};

export default RootLayout;
