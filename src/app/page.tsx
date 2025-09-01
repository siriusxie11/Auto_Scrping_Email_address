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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useEmailScraperStore, type EmailResult, type BatchResult, type SearchResult, type SearchHistory } from '@/store/email-scraper';
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
	TrendingUp,
	MapPin,
	Eye,
	Plus,
	Minus,
	Check,
	ChevronsUpDown
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
		isSearching,
		searchResults,
		searchHistory,
		currentSearchKeyword,
		currentSearchRegion,
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
		resetBatch,
		setSearching,
		setSearchResults,
		setCurrentSearchKeyword,
		setCurrentSearchRegion,
		addToSearchHistory,
		clearSearchHistory,
		removeFromSearchHistory,
		resetSearch
	} = useEmailScraperStore();

	const [inputUrl, setInputUrl] = useState('');
	const [batchUrls, setBatchUrls] = useState('');
	const [activeTab, setActiveTab] = useState('single');
	const [searchKeyword, setSearchKeyword] = useState('');
	const [searchRegion, setSearchRegion] = useState('');
	const [searchLimit, setSearchLimit] = useState(100);
	const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
	const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

	// 国家列表数据
	const countries = [
		{ value: "GLOBAL", label: "🌍 全球", group: "全球" },
		
		// 亚洲
		{ value: "CN", label: "🇨🇳 中国", group: "亚洲" },
		{ value: "JP", label: "🇯🇵 日本", group: "亚洲" },
		{ value: "KR", label: "🇰🇷 韩国", group: "亚洲" },
		{ value: "IN", label: "🇮🇳 印度", group: "亚洲" },
		{ value: "SG", label: "🇸🇬 新加坡", group: "亚洲" },
		{ value: "HK", label: "🇭🇰 香港", group: "亚洲" },
		{ value: "TW", label: "🇹🇼 台湾", group: "亚洲" },
		{ value: "TH", label: "🇹🇭 泰国", group: "亚洲" },
		{ value: "MY", label: "🇲🇾 马来西亚", group: "亚洲" },
		{ value: "PH", label: "🇵🇭 菲律宾", group: "亚洲" },
		{ value: "ID", label: "🇮🇩 印度尼西亚", group: "亚洲" },
		{ value: "VN", label: "🇻🇳 越南", group: "亚洲" },
		{ value: "BD", label: "🇧🇩 孟加拉国", group: "亚洲" },
		{ value: "PK", label: "🇵🇰 巴基斯坦", group: "亚洲" },
		{ value: "LK", label: "🇱🇰 斯里兰卡", group: "亚洲" },
		{ value: "MM", label: "🇲🇲 缅甸", group: "亚洲" },
		{ value: "KH", label: "🇰🇭 柬埔寨", group: "亚洲" },
		{ value: "LA", label: "🇱🇦 老挝", group: "亚洲" },
		{ value: "BN", label: "🇧🇳 文莱", group: "亚洲" },
		{ value: "MN", label: "🇲🇳 蒙古", group: "亚洲" },
		{ value: "KZ", label: "🇰🇿 哈萨克斯坦", group: "亚洲" },
		{ value: "UZ", label: "🇺🇿 乌兹别克斯坦", group: "亚洲" },
		{ value: "KG", label: "🇰🇬 吉尔吉斯斯坦", group: "亚洲" },
		{ value: "TJ", label: "🇹🇯 塔吉克斯坦", group: "亚洲" },
		{ value: "TM", label: "🇹🇲 土库曼斯坦", group: "亚洲" },
		{ value: "AF", label: "🇦🇫 阿富汗", group: "亚洲" },
		{ value: "NP", label: "🇳🇵 尼泊尔", group: "亚洲" },
		{ value: "BT", label: "🇧🇹 不丹", group: "亚洲" },
		{ value: "MV", label: "🇲🇻 马尔代夫", group: "亚洲" },

		// 欧洲
		{ value: "UK", label: "🇬🇧 英国", group: "欧洲" },
		{ value: "DE", label: "🇩🇪 德国", group: "欧洲" },
		{ value: "FR", label: "🇫🇷 法国", group: "欧洲" },
		{ value: "IT", label: "🇮🇹 意大利", group: "欧洲" },
		{ value: "ES", label: "🇪🇸 西班牙", group: "欧洲" },
		{ value: "RU", label: "🇷🇺 俄罗斯", group: "欧洲" },
		{ value: "NL", label: "🇳🇱 荷兰", group: "欧洲" },
		{ value: "SE", label: "🇸🇪 瑞典", group: "欧洲" },
		{ value: "NO", label: "🇳🇴 挪威", group: "欧洲" },
		{ value: "DK", label: "🇩🇰 丹麦", group: "欧洲" },
		{ value: "FI", label: "🇫🇮 芬兰", group: "欧洲" },
		{ value: "PL", label: "🇵🇱 波兰", group: "欧洲" },
		{ value: "CZ", label: "🇨🇿 捷克", group: "欧洲" },
		{ value: "HU", label: "🇭🇺 匈牙利", group: "欧洲" },
		{ value: "AT", label: "🇦🇹 奥地利", group: "欧洲" },
		{ value: "CH", label: "🇨🇭 瑞士", group: "欧洲" },
		{ value: "BE", label: "🇧🇪 比利时", group: "欧洲" },
		{ value: "IE", label: "🇮🇪 爱尔兰", group: "欧洲" },
		{ value: "PT", label: "🇵🇹 葡萄牙", group: "欧洲" },
		{ value: "GR", label: "🇬🇷 希腊", group: "欧洲" },
		{ value: "RO", label: "🇷🇴 罗马尼亚", group: "欧洲" },
		{ value: "BG", label: "🇧🇬 保加利亚", group: "欧洲" },
		{ value: "HR", label: "🇭🇷 克罗地亚", group: "欧洲" },
		{ value: "SI", label: "🇸🇮 斯洛文尼亚", group: "欧洲" },
		{ value: "SK", label: "🇸🇰 斯洛伐克", group: "欧洲" },
		{ value: "LT", label: "🇱🇹 立陶宛", group: "欧洲" },
		{ value: "LV", label: "🇱🇻 拉脱维亚", group: "欧洲" },
		{ value: "EE", label: "🇪🇪 爱沙尼亚", group: "欧洲" },
		{ value: "UA", label: "🇺🇦 乌克兰", group: "欧洲" },
		{ value: "BY", label: "🇧🇾 白俄罗斯", group: "欧洲" },
		{ value: "MD", label: "🇲🇩 摩尔多瓦", group: "欧洲" },
		{ value: "RS", label: "🇷🇸 塞尔维亚", group: "欧洲" },
		{ value: "BA", label: "🇧🇦 波黑", group: "欧洲" },
		{ value: "ME", label: "🇲🇪 黑山", group: "欧洲" },
		{ value: "MK", label: "🇲🇰 北马其顿", group: "欧洲" },
		{ value: "AL", label: "🇦🇱 阿尔巴尼亚", group: "欧洲" },
		{ value: "XK", label: "🇽🇰 科索沃", group: "欧洲" },
		{ value: "IS", label: "🇮🇸 冰岛", group: "欧洲" },
		{ value: "LU", label: "🇱🇺 卢森堡", group: "欧洲" },
		{ value: "MT", label: "🇲🇹 马耳他", group: "欧洲" },
		{ value: "CY", label: "🇨🇾 塞浦路斯", group: "欧洲" },
		{ value: "MC", label: "🇲🇨 摩纳哥", group: "欧洲" },
		{ value: "AD", label: "🇦🇩 安道尔", group: "欧洲" },
		{ value: "SM", label: "🇸🇲 圣马力诺", group: "欧洲" },
		{ value: "VA", label: "🇻🇦 梵蒂冈", group: "欧洲" },
		{ value: "LI", label: "🇱🇮 列支敦士登", group: "欧洲" },

		// 北美洲
		{ value: "US", label: "🇺🇸 美国", group: "北美洲" },
		{ value: "CA", label: "🇨🇦 加拿大", group: "北美洲" },
		{ value: "MX", label: "🇲🇽 墨西哥", group: "北美洲" },
		{ value: "GT", label: "🇬🇹 危地马拉", group: "北美洲" },
		{ value: "BZ", label: "🇧🇿 伯利兹", group: "北美洲" },
		{ value: "SV", label: "🇸🇻 萨尔瓦多", group: "北美洲" },
		{ value: "HN", label: "🇭🇳 洪都拉斯", group: "北美洲" },
		{ value: "NI", label: "🇳🇮 尼加拉瓜", group: "北美洲" },
		{ value: "CR", label: "🇨🇷 哥斯达黎加", group: "北美洲" },
		{ value: "PA", label: "🇵🇦 巴拿马", group: "北美洲" },
		{ value: "CU", label: "🇨🇺 古巴", group: "北美洲" },
		{ value: "JM", label: "🇯🇲 牙买加", group: "北美洲" },
		{ value: "HT", label: "🇭🇹 海地", group: "北美洲" },
		{ value: "DO", label: "🇩🇴 多米尼加", group: "北美洲" },
		{ value: "BS", label: "🇧🇸 巴哈马", group: "北美洲" },
		{ value: "BB", label: "🇧🇧 巴巴多斯", group: "北美洲" },
		{ value: "TT", label: "🇹🇹 特立尼达和多巴哥", group: "北美洲" },
		{ value: "GD", label: "🇬🇩 格林纳达", group: "北美洲" },
		{ value: "LC", label: "🇱🇨 圣卢西亚", group: "北美洲" },
		{ value: "VC", label: "🇻🇨 圣文森特和格林纳丁斯", group: "北美洲" },
		{ value: "AG", label: "🇦🇬 安提瓜和巴布达", group: "北美洲" },
		{ value: "DM", label: "🇩🇲 多米尼克", group: "北美洲" },
		{ value: "KN", label: "🇰🇳 圣基茨和尼维斯", group: "北美洲" },

		// 南美洲
		{ value: "BR", label: "🇧🇷 巴西", group: "南美洲" },
		{ value: "AR", label: "🇦🇷 阿根廷", group: "南美洲" },
		{ value: "CL", label: "🇨🇱 智利", group: "南美洲" },
		{ value: "CO", label: "🇨🇴 哥伦比亚", group: "南美洲" },
		{ value: "PE", label: "🇵🇪 秘鲁", group: "南美洲" },
		{ value: "VE", label: "🇻🇪 委内瑞拉", group: "南美洲" },
		{ value: "EC", label: "🇪🇨 厄瓜多尔", group: "南美洲" },
		{ value: "BO", label: "🇧🇴 玻利维亚", group: "南美洲" },
		{ value: "PY", label: "🇵🇾 巴拉圭", group: "南美洲" },
		{ value: "UY", label: "🇺🇾 乌拉圭", group: "南美洲" },
		{ value: "GY", label: "🇬🇾 圭亚那", group: "南美洲" },
		{ value: "SR", label: "🇸🇷 苏里南", group: "南美洲" },
		{ value: "GF", label: "🇬🇫 法属圭亚那", group: "南美洲" },

		// 大洋洲
		{ value: "AU", label: "🇦🇺 澳大利亚", group: "大洋洲" },
		{ value: "NZ", label: "🇳🇿 新西兰", group: "大洋洲" },
		{ value: "FJ", label: "🇫🇯 斐济", group: "大洋洲" },
		{ value: "PG", label: "🇵🇬 巴布亚新几内亚", group: "大洋洲" },
		{ value: "NC", label: "🇳🇨 新喀里多尼亚", group: "大洋洲" },
		{ value: "SB", label: "🇸🇧 所罗门群岛", group: "大洋洲" },
		{ value: "VU", label: "🇻🇺 瓦努阿图", group: "大洋洲" },
		{ value: "WS", label: "🇼🇸 萨摩亚", group: "大洋洲" },
		{ value: "TO", label: "🇹🇴 汤加", group: "大洋洲" },
		{ value: "KI", label: "🇰🇮 基里巴斯", group: "大洋洲" },
		{ value: "TV", label: "🇹🇻 图瓦卢", group: "大洋洲" },
		{ value: "NR", label: "🇳🇷 瑙鲁", group: "大洋洲" },
		{ value: "PW", label: "🇵🇼 帕劳", group: "大洋洲" },
		{ value: "MH", label: "🇲🇭 马绍尔群岛", group: "大洋洲" },
		{ value: "FM", label: "🇫🇲 密克罗尼西亚", group: "大洋洲" },

		// 非洲
		{ value: "ZA", label: "🇿🇦 南非", group: "非洲" },
		{ value: "NG", label: "🇳🇬 尼日利亚", group: "非洲" },
		{ value: "EG", label: "🇪🇬 埃及", group: "非洲" },
		{ value: "KE", label: "🇰🇪 肯尼亚", group: "非洲" },
		{ value: "GH", label: "🇬🇭 加纳", group: "非洲" },
		{ value: "ET", label: "🇪🇹 埃塞俄比亚", group: "非洲" },
		{ value: "TZ", label: "🇹🇿 坦桑尼亚", group: "非洲" },
		{ value: "UG", label: "🇺🇬 乌干达", group: "非洲" },
		{ value: "ZW", label: "🇿🇼 津巴布韦", group: "非洲" },
		{ value: "ZM", label: "🇿🇲 赞比亚", group: "非洲" },
		{ value: "BW", label: "🇧🇼 博茨瓦纳", group: "非洲" },
		{ value: "NA", label: "🇳🇦 纳米比亚", group: "非洲" },
		{ value: "MW", label: "🇲🇼 马拉维", group: "非洲" },
		{ value: "MZ", label: "🇲🇿 莫桑比克", group: "非洲" },
		{ value: "MG", label: "🇲🇬 马达加斯加", group: "非洲" },
		{ value: "MU", label: "🇲🇺 毛里求斯", group: "非洲" },
		{ value: "SC", label: "🇸🇨 塞舌尔", group: "非洲" },
		{ value: "RE", label: "🇷🇪 留尼汪", group: "非洲" },
		{ value: "MA", label: "🇲🇦 摩洛哥", group: "非洲" },
		{ value: "DZ", label: "🇩🇿 阿尔及利亚", group: "非洲" },
		{ value: "TN", label: "🇹🇳 突尼斯", group: "非洲" },
		{ value: "LY", label: "🇱🇾 利比亚", group: "非洲" },
		{ value: "SD", label: "🇸🇩 苏丹", group: "非洲" },
		{ value: "SS", label: "🇸🇸 南苏丹", group: "非洲" },
		{ value: "ER", label: "🇪🇷 厄立特里亚", group: "非洲" },
		{ value: "DJ", label: "🇩🇯 吉布提", group: "非洲" },
		{ value: "SO", label: "🇸🇴 索马里", group: "非洲" },
		{ value: "RW", label: "🇷🇼 卢旺达", group: "非洲" },
		{ value: "BI", label: "🇧🇮 布隆迪", group: "非洲" },
		{ value: "CD", label: "🇨🇩 刚果民主共和国", group: "非洲" },
		{ value: "CG", label: "🇨🇬 刚果共和国", group: "非洲" },
		{ value: "CF", label: "🇨🇫 中非共和国", group: "非洲" },
		{ value: "CM", label: "🇨🇲 喀麦隆", group: "非洲" },
		{ value: "TD", label: "🇹🇩 乍得", group: "非洲" },
		{ value: "NE", label: "🇳🇪 尼日尔", group: "非洲" },
		{ value: "ML", label: "🇲🇱 马里", group: "非洲" },
		{ value: "BF", label: "🇧🇫 布基纳法索", group: "非洲" },
		{ value: "CI", label: "🇨🇮 科特迪瓦", group: "非洲" },
		{ value: "LR", label: "🇱🇷 利比里亚", group: "非洲" },
		{ value: "SL", label: "🇸🇱 塞拉利昂", group: "非洲" },
		{ value: "GN", label: "🇬🇳 几内亚", group: "非洲" },
		{ value: "GW", label: "🇬🇼 几内亚比绍", group: "非洲" },
		{ value: "SN", label: "🇸🇳 塞内加尔", group: "非洲" },
		{ value: "GM", label: "🇬🇲 冈比亚", group: "非洲" },
		{ value: "CV", label: "🇨🇻 佛得角", group: "非洲" },
		{ value: "MR", label: "🇲🇷 毛里塔尼亚", group: "非洲" },
		{ value: "GA", label: "🇬🇦 加蓬", group: "非洲" },
		{ value: "GQ", label: "🇬🇶 赤道几内亚", group: "非洲" },
		{ value: "ST", label: "🇸🇹 圣多美和普林西比", group: "非洲" },
		{ value: "AO", label: "🇦🇴 安哥拉", group: "非洲" },
		{ value: "LS", label: "🇱🇸 莱索托", group: "非洲" },
		{ value: "SZ", label: "🇸🇿 斯威士兰", group: "非洲" },
		{ value: "KM", label: "🇰🇲 科摩罗", group: "非洲" },

		// 中东
		{ value: "SA", label: "🇸🇦 沙特阿拉伯", group: "中东" },
		{ value: "AE", label: "🇦🇪 阿联酋", group: "中东" },
		{ value: "QA", label: "🇶🇦 卡塔尔", group: "中东" },
		{ value: "KW", label: "🇰🇼 科威特", group: "中东" },
		{ value: "BH", label: "🇧🇭 巴林", group: "中东" },
		{ value: "OM", label: "🇴🇲 阿曼", group: "中东" },
		{ value: "YE", label: "🇾🇪 也门", group: "中东" },
		{ value: "IQ", label: "🇮🇶 伊拉克", group: "中东" },
		{ value: "IR", label: "🇮🇷 伊朗", group: "中东" },
		{ value: "TR", label: "🇹🇷 土耳其", group: "中东" },
		{ value: "IL", label: "🇮🇱 以色列", group: "中东" },
		{ value: "PS", label: "🇵🇸 巴勒斯坦", group: "中东" },
		{ value: "JO", label: "🇯🇴 约旦", group: "中东" },
		{ value: "LB", label: "🇱🇧 黎巴嫩", group: "中东" },
		{ value: "SY", label: "🇸🇾 叙利亚", group: "中东" },
		{ value: "AM", label: "🇦🇲 亚美尼亚", group: "中东" },
		{ value: "AZ", label: "🇦🇿 阿塞拜疆", group: "中东" },
		{ value: "GE", label: "🇬🇪 格鲁吉亚", group: "中东" },
	];

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

	const handleSearchWebsites = async () => {
		if (!searchKeyword.trim()) {
			toast.error('请输入搜索关键词');
			return;
		}

		setSearching(true);
		setCurrentSearchKeyword(searchKeyword);
		setCurrentSearchRegion(searchRegion);
		setSearchResults([]);

		try {
			const response = await fetch('/api/search-websites', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ 
					keyword: searchKeyword.trim(), 
					region: searchRegion === 'GLOBAL' ? '' : searchRegion,
					limit: searchLimit 
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || '搜索网站失败');
			}

			setSearchResults(data.results);
			
			// Add to search history
			const searchHistoryItem: SearchHistory = {
				id: Date.now().toString(),
				keyword: searchKeyword,
				region: searchRegion,
				results: data.results,
				count: data.count,
				timestamp: data.timestamp,
			};
			addToSearchHistory(searchHistoryItem);

			if (data.results.length === 0) {
				toast.info('未找到相关网站');
			} else {
				toast.success(`找到 ${data.results.length} 个相关网站`);
			}

		} catch (error: any) {
			toast.error(error.message);
		} finally {
			setSearching(false);
		}
	};

	const handleToggleUrlSelection = (url: string) => {
		const newSelected = new Set(selectedUrls);
		if (newSelected.has(url)) {
			newSelected.delete(url);
		} else {
			newSelected.add(url);
		}
		setSelectedUrls(newSelected);
	};

	const handleSelectAllUrls = () => {
		const allUrls = new Set(searchResults.map(result => result.url));
		setSelectedUrls(allUrls);
		toast.success(`已选择所有 ${allUrls.size} 个网站`);
	};

	const handleDeselectAllUrls = () => {
		setSelectedUrls(new Set());
		toast.success('已取消选择所有网站');
	};

	const handleBatchScrapeFromSearch = async () => {
		if (selectedUrls.size === 0) {
			toast.error('请选择要抓取的网站');
			return;
		}

		const urlsArray = Array.from(selectedUrls);
		setBatchUrls(urlsArray.join('\n'));
		setActiveTab('batch');
		
		// Auto-start batch scraping
		setTimeout(() => {
			handleBatchScrape();
		}, 100);
	};

	const handleSearchReset = () => {
		resetSearch();
		setSearchKeyword('');
		setSearchRegion('');
		setSelectedUrls(new Set());
		toast.success('已重置搜索');
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
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="single" className="flex items-center gap-2">
							<Globe className="h-4 w-4" />
							单个抓取
						</TabsTrigger>
						<TabsTrigger value="search" className="flex items-center gap-2">
							<Search className="h-4 w-4" />
							关键词搜索
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

					{/* Keyword Search Tab */}
					<TabsContent value="search" className="space-y-6">
						{/* Search Input Section */}
					<Card>
						<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Search className="h-5 w-5" />
									关键词搜索网站
								</CardTitle>
								<CardDescription>
									输入关键词自动搜索相关网站，支持按国家/地区筛选
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									<div className="md:col-span-2">
										<Input
											placeholder="例如: technology company, marketing agency"
											value={searchKeyword}
											onChange={(e) => setSearchKeyword(e.target.value)}
											onKeyDown={(e) => e.key === 'Enter' && !isSearching && handleSearchWebsites()}
											disabled={isSearching}
										/>
									</div>
									<Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												role="combobox"
												aria-expanded={countryPopoverOpen}
												className="justify-between"
											>
												{searchRegion
													? countries.find((country) => country.value === searchRegion)?.label
													: "选择国家/地区"}
												<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-[300px] p-0">
											<Command>
												<CommandInput placeholder="搜索国家/地区..." className="h-9" />
												<CommandEmpty>未找到国家/地区</CommandEmpty>
												<CommandList className="max-h-96">
													{/* 按地区分组 */}
													{["全球", "亚洲", "欧洲", "北美洲", "南美洲", "大洋洲", "非洲", "中东"].map((group) => {
														const groupCountries = countries.filter(country => country.group === group);
														if (groupCountries.length === 0) return null;
														
														return (
															<CommandGroup key={group} heading={group}>
																{groupCountries.map((country) => (
																	<CommandItem
																		key={country.value}
																		value={country.label}
																		onSelect={() => {
																			setSearchRegion(country.value === searchRegion ? "" : country.value);
																			setCountryPopoverOpen(false);
																		}}
																	>
																		{country.label}
																		<Check
																			className={`ml-auto h-4 w-4 ${
																				searchRegion === country.value ? "opacity-100" : "opacity-0"
																			}`}
																		/>
																	</CommandItem>
																))}
															</CommandGroup>
														);
													})}
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										<Button 
											onClick={handleSearchWebsites} 
											disabled={isSearching || !searchKeyword.trim()}
											className="min-w-[120px]"
										>
											{isSearching ? (
												<>
													<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
													搜索中...
												</>
											) : (
												<>
													<Search className="h-4 w-4 mr-2" />
													搜索网站
												</>
											)}
										</Button>
										<Button
											variant="outline"
											onClick={handleSearchReset}
											disabled={isSearching}
										>
									<Trash2 className="h-4 w-4 mr-2" />
											重置
								</Button>
							</div>
									<div className="text-sm text-gray-500">
										智能搜索: Google → Bing → DuckDuckGo
											</div>
								</div>

								{currentSearchKeyword && (
									<div className="flex items-center gap-2 text-sm text-gray-600">
										<MapPin className="h-4 w-4" />
										搜索: "{currentSearchKeyword}" 
										{currentSearchRegion && ` - ${currentSearchRegion}`}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Search Results */}
						{(isSearching || searchResults.length > 0) && (
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle className="flex items-center gap-2">
											<Eye className="h-5 w-5" />
											搜索结果
											{searchResults.length > 0 && (
												<Badge variant="secondary">
													{searchResults.length} 个网站
												</Badge>
											)}
										</CardTitle>
										{searchResults.length > 0 && (
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={handleSelectAllUrls}
													disabled={selectedUrls.size === searchResults.length}
												>
													<Plus className="h-4 w-4 mr-2" />
													全选
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={handleDeselectAllUrls}
													disabled={selectedUrls.size === 0}
												>
													<Minus className="h-4 w-4 mr-2" />
													取消全选
												</Button>
												<Button
													onClick={handleBatchScrapeFromSearch}
													disabled={selectedUrls.size === 0}
													className="bg-blue-600 hover:bg-blue-700"
												>
													<Target className="h-4 w-4 mr-2" />
													批量抓取选中 ({selectedUrls.size})
												</Button>
											</div>
										)}
										</div>
								</CardHeader>
								<CardContent>
									{isSearching ? (
										<div className="space-y-3">
											{[1, 2, 3, 4, 5].map((i) => (
												<Skeleton key={i} className="h-16 w-full" />
											))}
										</div>
									) : searchResults.length > 0 ? (
										<div className="space-y-3 max-h-96 overflow-y-auto">
											{searchResults.map((result, index) => (
												<div
													key={index}
													className={`border rounded-lg p-4 cursor-pointer transition-colors ${
														selectedUrls.has(result.url) 
															? 'bg-blue-50 border-blue-200' 
															: 'hover:bg-gray-50'
													}`}
													onClick={() => handleToggleUrlSelection(result.url)}
												>
													<div className="flex items-start justify-between">
														<div className="flex-1 min-w-0">
															<div className="flex items-center gap-2 mb-1">
																<input
																	type="checkbox"
																	checked={selectedUrls.has(result.url)}
																	onChange={() => handleToggleUrlSelection(result.url)}
																	className="w-4 h-4"
																	onClick={(e) => e.stopPropagation()}
																/>
																<h4 className="font-medium text-blue-600 truncate">
																	{result.title}
																</h4>
															</div>
															<div className="text-sm text-gray-600 mb-1">
																<Globe className="h-3 w-3 inline mr-1" />
																{result.url}
															</div>
															<p className="text-sm text-gray-500 line-clamp-2">
																{result.snippet}
															</p>
														</div>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="text-center py-8 text-gray-500">
											<Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
											<p>输入关键词搜索相关网站</p>
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
				{(history.length > 0 || batchHistory.length > 0 || searchHistory.length > 0) && (
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
									{searchHistory.length > 0 && (
										<Button
											variant="outline"
											size="sm"
											onClick={clearSearchHistory}
										>
											清空搜索历史
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
									<TabsTrigger value="search-history">
										搜索历史 ({searchHistory.length})
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
								
								<TabsContent value="search-history" className="space-y-4 mt-4">
									{searchHistory.length === 0 ? (
										<div className="text-center py-8 text-gray-500">
											<History className="h-12 w-12 mx-auto mb-4 opacity-50" />
											<p>暂无搜索历史</p>
										</div>
									) : (
										<div className="space-y-3">
											{searchHistory.map((item) => (
												<div
													key={item.id}
													className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
												>
													<div className="flex items-center justify-between mb-3">
														<div className="flex items-center gap-2">
															<Search className="h-4 w-4 text-gray-500" />
															<span className="font-medium">
																"{item.keyword}"
															</span>
															{item.region && (
																<Badge variant="outline" className="text-xs">
																	{item.region}
																</Badge>
															)}
															<Badge variant="outline">
																{item.count} 个结果
															</Badge>
														</div>
														<div className="flex gap-2">
															<Button
																variant="ghost"
																size="sm"
																onClick={() => {
																	setSearchKeyword(item.keyword);
																	setSearchRegion(item.region);
																	setSearchResults(item.results);
																	setActiveTab('search');
																}}
																title="重新加载搜索结果"
															>
																<RefreshCw className="h-4 w-4" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => removeFromSearchHistory(item.id)}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
													</div>
													
													<div className="text-sm text-gray-500 mb-2">
														<Clock className="h-3 w-3 inline mr-1" />
														{formatTimestamp(item.timestamp)}
													</div>
													
													<div className="text-sm text-gray-600">
														找到的网站示例:
														<div className="mt-1 space-y-1">
															{item.results.slice(0, 3).map((result, index) => (
																<div key={index} className="text-xs text-blue-600 truncate">
																	• {result.title} - {result.domain}
																</div>
															))}
															{item.results.length > 3 && (
																<div className="text-xs text-gray-400">
																	还有 {item.results.length - 3} 个结果...
																</div>
															)}
														</div>
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
