import "@/styles/globals.css";

import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "自动抓取并匹配网页邮箱",
	description: "自动抓取网页中的邮箱地址，支持 Cloudflare 保护邮箱解码",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="zh-CN">
			<body className="font-sans antialiased">
				{children}
				<Toaster position="top-center" richColors />
			</body>
		</html>
	);
}
