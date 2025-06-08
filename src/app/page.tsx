'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useEmailScraperStore, type EmailResult } from '@/store/email-scraper';
import { 
	Search, 
	Mail, 
	Copy, 
	Trash2, 
	Globe, 
	Clock, 
	AlertCircle, 
	CheckCircle2,
	RefreshCw,
	History
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * @description 这只是个示例页面，你可以随意修改这个页面或进行全面重构
 */
export default function EmailScraperPage() {
	const {
		isLoading,
		currentUrl,
		currentEmails,
		error,
		history,
		setLoading,
		setCurrentUrl,
		setCurrentEmails,
		setError,
		addToHistory,
		clearHistory,
		removeFromHistory,
		reset
	} = useEmailScraperStore();

	const [inputUrl, setInputUrl] = useState('');

	const handleScrape = async () => {
		if (!inputUrl.trim()) {
			toast.error('请输入网址');
			return;
		}

		// Add protocol if missing
		let url = inputUrl.trim();
		if (!url.startsWith('http://') && !url.startsWith('https://')) {
			url = 'https://' + url;
		}

		setLoading(true);
		setError(null);
		setCurrentUrl(url);
		setCurrentEmails([]);

		try {
			const response = await fetch('/api/scrape-emails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || '抓取失败');
			}

			setCurrentEmails(data.emails);
			
			// Add to history
			const result: EmailResult = {
				id: Date.now().toString(),
				url: data.url,
				emails: data.emails,
				count: data.count,
				timestamp: data.timestamp,
			};
			addToHistory(result);

			if (data.emails.length === 0) {
				toast.info('未找到邮箱地址');
			} else {
				toast.success(`成功提取 ${data.emails.length} 个邮箱地址`);
			}

		} catch (error: any) {
			setError(error.message);
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	const handleCopyEmail = (email: string) => {
		navigator.clipboard.writeText(email);
		toast.success('邮箱已复制到剪贴板');
	};

	const handleCopyAllEmails = () => {
		if (currentEmails.length === 0) return;
		
		const emailText = currentEmails.join('\n');
		navigator.clipboard.writeText(emailText);
		toast.success(`已复制 ${currentEmails.length} 个邮箱地址`);
	};

	const handleReset = () => {
		reset();
		setInputUrl('');
		toast.success('已重置');
	};

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString('zh-CN');
	};

	return (
		<main className="min-h-screen bg-gray-50 p-4">
			<div className="mx-auto max-w-6xl space-y-6">
				{/* Header */}
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold text-gray-900">
						自动抓取并匹配网页邮箱
					</h1>
					<p className="text-gray-600">
						自动抓取网页中的邮箱地址，支持 Cloudflare 保护邮箱解码
					</p>
				</div>

				{/* Input Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Globe className="h-5 w-5" />
							输入网址
						</CardTitle>
						<CardDescription>
							输入要抓取邮箱的网页地址，支持 http:// 和 https://
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="例如: example.com 或 https://example.com"
								value={inputUrl}
								onChange={(e) => setInputUrl(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleScrape()}
								disabled={isLoading}
								className="flex-1"
							/>
							<Button 
								onClick={handleScrape} 
								disabled={isLoading || !inputUrl.trim()}
								className="min-w-[100px]"
							>
								{isLoading ? (
									<>
										<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
										抓取中...
									</>
								) : (
									<>
										<Search className="h-4 w-4 mr-2" />
										开始抓取
									</>
								)}
							</Button>
						</div>

						{currentUrl && (
							<div className="flex items-center gap-2 text-sm text-gray-600">
								<Globe className="h-4 w-4" />
								当前网址: {currentUrl}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Error Alert */}
				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Results Section */}
				{(isLoading || currentEmails.length > 0) && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<Mail className="h-5 w-5" />
									提取结果
									{currentEmails.length > 0 && (
										<Badge variant="secondary">{currentEmails.length} 个邮箱</Badge>
									)}
								</CardTitle>
								{currentEmails.length > 0 && (
									<div className="flex gap-2">
										<Button variant="outline" size="sm" onClick={handleCopyAllEmails}>
											<Copy className="h-4 w-4 mr-2" />
											复制全部
										</Button>
										<Button variant="outline" size="sm" onClick={handleReset}>
											<RefreshCw className="h-4 w-4 mr-2" />
											重置
										</Button>
									</div>
								)}
							</div>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="space-y-2">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-4 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
								</div>
							) : currentEmails.length > 0 ? (
								<div className="space-y-2">
									{currentEmails.map((email, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
										>
											<div className="flex items-center gap-2">
												<Mail className="h-4 w-4 text-gray-500" />
												<span className="font-mono text-sm">{email}</span>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCopyEmail(email)}
											>
												<Copy className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-gray-500">
									<Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
									<p>未找到邮箱地址</p>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* History Section */}
				{history.length > 0 && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<History className="h-5 w-5" />
									抓取历史
									<Badge variant="outline">{history.length} 条记录</Badge>
								</CardTitle>
								<Button variant="outline" size="sm" onClick={clearHistory}>
									<Trash2 className="h-4 w-4 mr-2" />
									清空历史
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{history.map((item) => (
									<div key={item.id} className="border rounded-lg p-4 space-y-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Globe className="h-4 w-4 text-gray-500" />
												<span className="text-sm font-medium truncate max-w-md">
													{item.url}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<Badge variant="secondary">
													{item.count} 个邮箱
												</Badge>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => removeFromHistory(item.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
										
										<div className="flex items-center gap-2 text-xs text-gray-500">
											<Clock className="h-3 w-3" />
											{formatTimestamp(item.timestamp)}
										</div>

										{item.emails.length > 0 && (
											<>
												<Separator />
												<div className="space-y-1">
													{item.emails.slice(0, 3).map((email, index) => (
														<div key={index} className="flex items-center gap-2 text-sm">
															<Mail className="h-3 w-3 text-gray-400" />
															<span className="font-mono">{email}</span>
														</div>
													))}
													{item.emails.length > 3 && (
														<div className="text-xs text-gray-500 ml-5">
															还有 {item.emails.length - 3} 个邮箱...
														</div>
													)}
												</div>
											</>
										)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Instructions */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle2 className="h-5 w-5" />
							使用说明
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm text-gray-600">
						<div className="flex items-start gap-2">
							<span className="font-semibold text-blue-600">1.</span>
							<span>输入要抓取的网页地址，支持自动添加 https:// 协议</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="font-semibold text-blue-600">2.</span>
							<span>系统会自动提取页面中的所有邮箱地址，包括 Cloudflare 保护的邮箱</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="font-semibold text-blue-600">3.</span>
							<span>支持一键复制单个邮箱或批量复制所有邮箱</span>
						</div>
						<div className="flex items-start gap-2">
							<span className="font-semibold text-blue-600">4.</span>
							<span>抓取历史会自动保存到本地，方便查看之前的结果</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
