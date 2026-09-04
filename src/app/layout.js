import "./globals.css";

export const metadata = {
  title: "الخُلاصة",
  description: "منصتك التعليمية الذكية",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
