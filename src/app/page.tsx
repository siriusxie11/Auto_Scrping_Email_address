'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmailScraperStore, type EmailResult, type BatchResult } from '@/store/email-scraper';
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
	History,
	List,
	Download,
	FileText,
	Target,
	Timer,
	TrendingUp
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
		isBatchLoading,
		currentBatchResult,
		batchHistory,
		setLoading,
		setCurrentUrl,
		setCurrentEmails,
		setError,
		addToHistory,
		clearHistory,
		removeFromHistory,
		reset,
		setBatchLoading,
		setCurrentBatchResult,
		addToBatchHistory,
		clearBatchHistory,
		removeFromBatchHistory,
		resetBatch
	} = useEmailScraperStore();

	const [inputUrl, setInputUrl] = useState('');
	const [batchUrls, setBatchUrls] = useState('');
	const [activeTab, setActiveTab] = useState('single');

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

	const handleBatchScrape = async () => {
		if (!batchUrls.trim()) {
			toast.error('请输入网址列表');
			return;
		}

		// Parse URLs from textarea (split by newlines)
		const urls = batchUrls
			.split('\n')
			.map(url => url.trim())
			.filter(url => url.length > 0);

		if (urls.length === 0) {
			toast.error('请输入有效的网址');
			return;
		}

		if (urls.length > 50) {
			toast.error('一次最多支持抓取50个网址');
			return;
		}

		setBatchLoading(true);
		setCurrentBatchResult(null);

		try {
			const startTime = Date.now();
			
			const response = await fetch('/api/scrape-emails-batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ urls }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || '批量抓取失败');
			}

			const endTime = Date.now();
			const duration = endTime - startTime;

			// Create batch result
			const batchResult: BatchResult = {
				id: Date.now().toString(),
				urls,
				results: data.results,
				totalEmails: data.totalEmails,
				uniqueEmailCount: data.uniqueEmailCount,
				successCount: data.successCount,
				failureCount: data.failureCount,
				timestamp: data.timestamp,
				duration: data.duration || duration,
			};

			setCurrentBatchResult(batchResult);
			addToBatchHistory(batchResult);

			toast.success(`批量抓取完成！共获取 ${data.uniqueEmailCount} 个独特邮箱地址`);

		} catch (error: any) {
			toast.error(error.message);
		} finally {
			setBatchLoading(false);
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

	const handleCopyBatchEmails = (emails: string[]) => {
		if (emails.length === 0) return;
		
		const emailText = emails.join('\n');
		navigator.clipboard.writeText(emailText);
		toast.success(`已复制 ${emails.length} 个邮箱地址`);
	};

	const handleExportBatchResult = (batchResult: BatchResult) => {
		const csvContent = [
			'网址,邮箱地址,状态',
			...batchResult.results.flatMap(result => 
				result.emails.length > 0 
					? result.emails.map(email => `${result.url},${email},成功`)
					: [`${result.url},,${result.success ? '无邮箱' : '失败'}`]
			)
		].join('\n');

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `邮箱抓取结果_${new Date().toLocaleDateString()}.csv`;
		link.click();
		
		toast.success('结果已导出为CSV文件');
	};

	const handleReset = () => {
		reset();
		setInputUrl('');
		toast.success('已重置');
	};

	const handleBatchReset = () => {
		resetBatch();
		setBatchUrls('');
		toast.success('已重置批量抓取');
	};

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString('zh-CN');
	};

	const formatDuration = (duration: number) => {
		const seconds = Math.floor(duration / 1000);
		const minutes = Math.floor(seconds / 60);
		if (minutes > 0) {
			return `${minutes}分${seconds % 60}秒`;
		}
		return `${seconds}秒`;
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
						支持单个网站和批量网站的邮箱抓取，自动解码 Cloudflare 保护邮箱
					</p>
				</div>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="single" className="flex items-center gap-2">
							<Globe className="h-4 w-4" />
							单个抓取
						</TabsTrigger>
						<TabsTrigger value="batch" className="flex items-center gap-2">
							<List className="h-4 w-4" />
							批量抓取
						</TabsTrigger>
					</TabsList>

					{/* Single Scraping Tab */}
					<TabsContent value="single" className="space-y-6">
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
											抓取结果
											{currentEmails.length > 0 && (
												<Badge variant="secondary">
													{currentEmails.length} 个邮箱
												</Badge>
											)}
										</CardTitle>
										{currentEmails.length > 0 && (
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={handleCopyAllEmails}
												>
													<Copy className="h-4 w-4 mr-2" />
													复制全部
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={handleReset}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													重置
												</Button>
											</div>
										)}
									</div>
								</CardHeader>
								<CardContent>
									{isLoading ? (
										<div className="space-y-3">
											{[1, 2, 3].map((i) => (
												<Skeleton key={i} className="h-12 w-full" />
											))}
										</div>
									) : currentEmails.length > 0 ? (
										<div className="space-y-2 max-h-96 overflow-y-auto">
											{currentEmails.map((email, index) => (
												<div
													key={index}
													className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
												>
													<span className="font-mono text-sm">{email}</span>
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
											<Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
											<p>未找到邮箱地址</p>
										</div>
									)}
								</CardContent>
							</Card>
						)}
					</TabsContent>

					{/* Batch Scraping Tab */}
					<TabsContent value="batch" className="space-y-6">
						{/* Batch Input Section */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<List className="h-5 w-5" />
									批量输入网址
								</CardTitle>
								<CardDescription>
									每行一个网址，最多支持50个网址。支持 http:// 和 https://
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Textarea
										placeholder={`请输入网址列表，每行一个，例如：\nexample.com\nhttps://github.com\nstackoverflow.com`}
										value={batchUrls}
										onChange={(e) => setBatchUrls(e.target.value)}
										disabled={isBatchLoading}
										className="min-h-[120px] font-mono text-sm"
										rows={6}
									/>
									<div className="flex items-center justify-between text-sm text-gray-500">
										<span>
											当前输入: {batchUrls.split('\n').filter(url => url.trim()).length} 个网址
										</span>
										<span>最多支持 50 个网址</span>
									</div>
								</div>

								<div className="flex gap-2">
									<Button 
										onClick={handleBatchScrape} 
										disabled={isBatchLoading || !batchUrls.trim()}
										className="flex-1"
									>
										{isBatchLoading ? (
											<>
												<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
												批量抓取中...
											</>
										) : (
											<>
												<Target className="h-4 w-4 mr-2" />
												开始批量抓取
											</>
										)}
									</Button>
									<Button
										variant="outline"
										onClick={handleBatchReset}
										disabled={isBatchLoading}
									>
										<Trash2 className="h-4 w-4 mr-2" />
										重置
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Batch Results */}
						{currentBatchResult && (
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											<TrendingUp className="h-5 w-5" />
											批量抓取结果
										</CardTitle>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleCopyBatchEmails(currentBatchResult.totalEmails)}
											>
												<Copy className="h-4 w-4 mr-2" />
												复制全部邮箱
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleExportBatchResult(currentBatchResult)}
											>
												<Download className="h-4 w-4 mr-2" />
												导出CSV
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									{/* Summary Statistics */}
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="bg-blue-50 p-4 rounded-lg text-center">
											<div className="text-2xl font-bold text-blue-600">
												{currentBatchResult.uniqueEmailCount}
											</div>
											<div className="text-sm text-blue-600">独特邮箱</div>
										</div>
										<div className="bg-green-50 p-4 rounded-lg text-center">
											<div className="text-2xl font-bold text-green-600">
												{currentBatchResult.successCount}
											</div>
											<div className="text-sm text-green-600">成功网站</div>
										</div>
										<div className="bg-red-50 p-4 rounded-lg text-center">
											<div className="text-2xl font-bold text-red-600">
												{currentBatchResult.failureCount}
											</div>
											<div className="text-sm text-red-600">失败网站</div>
										</div>
										<div className="bg-gray-50 p-4 rounded-lg text-center">
											<div className="text-2xl font-bold text-gray-600">
												{formatDuration(currentBatchResult.duration)}
											</div>
											<div className="text-sm text-gray-600">总耗时</div>
										</div>
									</div>

									{/* All Emails */}
									{currentBatchResult.totalEmails.length > 0 && (
										<div>
											<h4 className="font-medium mb-3 flex items-center gap-2">
												<Mail className="h-4 w-4" />
												所有邮箱地址 ({currentBatchResult.totalEmails.length})
											</h4>
											<div className="space-y-2 max-h-64 overflow-y-auto">
												{currentBatchResult.totalEmails.map((email, index) => (
													<div
														key={index}
														className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
													>
														<span className="font-mono text-sm">{email}</span>
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
										</div>
									)}

									{/* Detailed Results */}
									<div>
										<h4 className="font-medium mb-3 flex items-center gap-2">
											<FileText className="h-4 w-4" />
											详细结果
										</h4>
										<div className="space-y-3 max-h-96 overflow-y-auto">
											{currentBatchResult.results.map((result, index) => (
												<div key={index} className="border rounded-lg p-4">
													<div className="flex items-center justify-between mb-2">
														<div className="flex items-center gap-2">
															<Globe className="h-4 w-4" />
															<span className="font-medium truncate">{result.url}</span>
														</div>
														<Badge 
															variant={result.success ? "default" : "destructive"}
														>
															{result.success ? `${result.count} 个邮箱` : '失败'}
														</Badge>
													</div>
													
													{result.success && result.emails.length > 0 && (
														<div className="mt-2">
															<div className="flex flex-wrap gap-1">
																{result.emails.map((email, emailIndex) => (
																	<Badge key={emailIndex} variant="outline" className="text-xs">
																		{email}
																	</Badge>
																))}
															</div>
														</div>
													)}
													
													{!result.success && (
														<div className="mt-2 text-sm text-red-600">
															{(result as any).error}
														</div>
													)}
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>

				{/* History Section */}
				{(history.length > 0 || batchHistory.length > 0) && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<History className="h-5 w-5" />
									历史记录
								</CardTitle>
								<div className="flex gap-2">
									{history.length > 0 && (
										<Button
											variant="outline"
											size="sm"
											onClick={clearHistory}
										>
											清空单个抓取
										</Button>
									)}
									{batchHistory.length > 0 && (
										<Button
											variant="outline"
											size="sm"
											onClick={clearBatchHistory}
										>
											清空批量抓取
										</Button>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="single-history" className="w-full">
								<TabsList>
									<TabsTrigger value="single-history">
										单个抓取 ({history.length})
									</TabsTrigger>
									<TabsTrigger value="batch-history">
										批量抓取 ({batchHistory.length})
									</TabsTrigger>
								</TabsList>
								
								<TabsContent value="single-history" className="space-y-4 mt-4">
									{history.length === 0 ? (
										<div className="text-center py-8 text-gray-500">
											<History className="h-12 w-12 mx-auto mb-4 opacity-50" />
											<p>暂无单个抓取历史</p>
										</div>
									) : (
										<div className="space-y-3">
											{history.map((item) => (
												<div
													key={item.id}
													className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
												>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2 mb-1">
															<Globe className="h-4 w-4 text-gray-500" />
															<span className="font-medium truncate">{item.url}</span>
															<Badge variant="outline">{item.count} 个邮箱</Badge>
														</div>
														<div className="flex items-center gap-2 text-sm text-gray-500">
															<Clock className="h-3 w-3" />
															{formatTimestamp(item.timestamp)}
														</div>
													</div>
													<div className="flex gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => handleCopyBatchEmails(item.emails)}
														>
															<Copy className="h-4 w-4" />
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => removeFromHistory(item.id)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</TabsContent>
								
								<TabsContent value="batch-history" className="space-y-4 mt-4">
									{batchHistory.length === 0 ? (
										<div className="text-center py-8 text-gray-500">
											<History className="h-12 w-12 mx-auto mb-4 opacity-50" />
											<p>暂无批量抓取历史</p>
										</div>
									) : (
										<div className="space-y-3">
											{batchHistory.map((item) => (
												<div
													key={item.id}
													className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
												>
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-2">
															<List className="h-4 w-4 text-gray-500" />
															<span className="font-medium">
																批量抓取 - {item.urls.length} 个网站
															</span>
															<Badge variant="outline">
																{item.uniqueEmailCount} 个独特邮箱
															</Badge>
														</div>
														<div className="flex gap-2">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleCopyBatchEmails(item.totalEmails)}
															>
																<Copy className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => handleExportBatchResult(item)}
															>
																<Download className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => removeFromBatchHistory(item.id)}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</div>
													
													<div className="grid grid-cols-4 gap-4 mb-3">
														<div className="text-center">
															<div className="text-lg font-semibold text-green-600">
																{item.successCount}
															</div>
															<div className="text-xs text-gray-500">成功</div>
														</div>
														<div className="text-center">
															<div className="text-lg font-semibold text-red-600">
																{item.failureCount}
															</div>
															<div className="text-xs text-gray-500">失败</div>
														</div>
														<div className="text-center">
															<div className="text-lg font-semibold text-blue-600">
																{item.uniqueEmailCount}
															</div>
															<div className="text-xs text-gray-500">邮箱</div>
														</div>
														<div className="text-center">
															<div className="text-lg font-semibold text-gray-600">
																{formatDuration(item.duration)}
															</div>
															<div className="text-xs text-gray-500">耗时</div>
														</div>
													</div>
													
													<div className="flex items-center gap-2 text-sm text-gray-500">
														<Clock className="h-3 w-3" />
														{formatTimestamp(item.timestamp)}
													</div>
												</div>
											))}
										</div>
									)}
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				)}
			</div>
		</main>
	);
}
