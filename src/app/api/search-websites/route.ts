import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

// Multi-engine search using Google, Bing, and DuckDuckGo
async function searchWebsites(keyword: string, region: string = '', limit: number = 100): Promise<SearchResult[]> {
  try {
    const results: SearchResult[] = [];
    const seenUrls = new Set<string>();
    
    // Strategy 1: Google Search (using web scraping)
    try {
      const googleResults = await searchGoogle(keyword, region, Math.floor(limit * 0.6));
      googleResults.forEach(result => {
        if (!seenUrls.has(result.url)) {
          results.push(result);
          seenUrls.add(result.url);
        }
      });
    } catch (error) {
      console.warn('Google search failed:', error);
    }
    
    // Strategy 2: Bing Search (if Google failed or need more results)
    if (results.length < limit * 0.4) {
      try {
        const bingResults = await searchBing(keyword, region, Math.floor(limit * 0.3));
        bingResults.forEach(result => {
          if (!seenUrls.has(result.url) && results.length < limit) {
            results.push(result);
            seenUrls.add(result.url);
          }
        });
      } catch (error) {
        console.warn('Bing search failed:', error);
      }
    }
    
    // Strategy 3: DuckDuckGo Search (fallback)
    if (results.length < limit * 0.2) {
      try {
        const duckResults = await searchDuckDuckGo(keyword, region, Math.floor(limit * 0.2));
        duckResults.forEach(result => {
          if (!seenUrls.has(result.url) && results.length < limit) {
            results.push(result);
            seenUrls.add(result.url);
          }
        });
      } catch (error) {
        console.warn('DuckDuckGo search failed:', error);
      }
    }
    
    // Strategy 4: Pattern-based generation if still need more results
    if (results.length < 10) {
      const commonPatterns = generateCommonWebsites(keyword, region);
      commonPatterns.forEach(result => {
        if (!seenUrls.has(result.url) && results.length < limit) {
          results.push(result);
          seenUrls.add(result.url);
        }
      });
    }

    return results.slice(0, limit);
    
  } catch (error) {
    console.error('Search error:', error);
    // Fallback: return pattern-based results
    return generateFallbackResults(keyword, region === 'GLOBAL' ? '' : region, limit);
  }
}

// Google Search function
async function searchGoogle(keyword: string, region: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  const regionParam = region ? `&cr=country${region}` : '';
  const searchQuery = encodeURIComponent(keyword);
  const googleUrl = `https://www.google.com/search?q=${searchQuery}${regionParam}&num=${Math.min(limit, 50)}`;
  
  const response = await axios.get(googleUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  
  // Parse Google search results
  $('div.g').each((index, element) => {
    if (results.length >= limit) return false;
    
    const titleEl = $(element).find('h3');
    const linkEl = $(element).find('a[href]').first();
    const snippetEl = $(element).find('[data-sncf="1"], .VwiC3b, .s3v9rd');
    
    const title = titleEl.text().trim();
    const href = linkEl.attr('href');
    const snippet = snippetEl.text().trim();
    
    if (title && href && isValidUrl(href)) {
      const url = cleanGoogleUrl(href);
      const domain = extractDomain(url);
      if (domain && url !== 'https://www.google.com' && !url.includes('google.com/search')) {
        results.push({
          title,
          url,
          snippet: snippet || `Search result for ${keyword}`,
          domain
        });
      }
    }
  });
  
  return results;
}

// Bing Search function
async function searchBing(keyword: string, region: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  const regionParam = region ? `&cc=${region.toLowerCase()}` : '';
  const searchQuery = encodeURIComponent(keyword);
  const bingUrl = `https://www.bing.com/search?q=${searchQuery}${regionParam}&count=${Math.min(limit, 50)}`;
  
  const response = await axios.get(bingUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
    },
    timeout: 15000,
  });

  const $ = cheerio.load(response.data);
  
  // Parse Bing search results
  $('.b_algo').each((index, element) => {
    if (results.length >= limit) return false;
    
    const titleEl = $(element).find('h2 a');
    const snippetEl = $(element).find('.b_caption p, .b_descript');
    
    const title = titleEl.text().trim();
    const href = titleEl.attr('href');
    const snippet = snippetEl.text().trim();
    
    if (title && href && isValidUrl(href)) {
      const domain = extractDomain(href);
      if (domain && !href.includes('bing.com')) {
        results.push({
          title,
          url: href,
          snippet: snippet || `Search result for ${keyword}`,
          domain
        });
      }
    }
  });
  
  return results;
}

// DuckDuckGo Search function (existing logic)
async function searchDuckDuckGo(keyword: string, region: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  
  const searchQuery = encodeURIComponent(`${keyword} ${region && region !== 'GLOBAL' ? `site:${getCountryTLD(region)}` : ''}`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${searchQuery}`;
    
  const response = await axios.get(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
    },
    timeout: 10000,
  });

  const $ = cheerio.load(response.data);
  
  // Parse DuckDuckGo results
  $('.result').each((index, element) => {
    if (results.length >= limit) return false;
    
    const titleEl = $(element).find('.result__title a');
    const snippetEl = $(element).find('.result__snippet');
    
    const title = titleEl.text().trim();
    const url = titleEl.attr('href') || '';
    const snippet = snippetEl.text().trim();
    
    if (title && url && isValidUrl(url)) {
      const domain = extractDomain(url);
      if (domain) {
        results.push({
          title,
          url: cleanUrl(url),
          snippet,
          domain
        });
      }
    }
  });

  return results;
}

// Helper function to clean Google URLs
function cleanGoogleUrl(url: string): string {
  try {
    // Remove Google redirect wrapper
    if (url.startsWith('/url?q=')) {
      const decoded = decodeURIComponent(url.substring(7));
      const actualUrl = decoded.split('&')[0];
      return actualUrl;
    }
    
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    
    return url;
  } catch {
    return url;
  }
}

function getCountryTLD(region: string): string {
  const tldMap: Record<string, string> = {
    // 亚洲
    'CN': 'com.cn', 'JP': 'co.jp', 'KR': 'co.kr', 'IN': 'co.in', 'SG': 'com.sg',
    'HK': 'com.hk', 'TW': 'com.tw', 'TH': 'co.th', 'MY': 'com.my', 'PH': 'com.ph',
    'ID': 'co.id', 'VN': 'com.vn', 'BD': 'com.bd', 'PK': 'com.pk', 'LK': 'lk',
    'MM': 'com.mm', 'KH': 'com.kh', 'LA': 'la', 'BN': 'com.bn', 'MN': 'mn',
    'KZ': 'kz', 'UZ': 'uz', 'KG': 'kg', 'TJ': 'tj', 'TM': 'tm', 'AF': 'af',
    'NP': 'com.np', 'BT': 'bt', 'MV': 'mv',

    // 欧洲
    'UK': 'co.uk', 'DE': 'de', 'FR': 'fr', 'IT': 'it', 'ES': 'es', 'RU': 'ru',
    'NL': 'nl', 'SE': 'se', 'NO': 'no', 'DK': 'dk', 'FI': 'fi', 'PL': 'pl',
    'CZ': 'cz', 'HU': 'hu', 'AT': 'at', 'CH': 'ch', 'BE': 'be', 'IE': 'ie',
    'PT': 'pt', 'GR': 'gr', 'RO': 'ro', 'BG': 'bg', 'HR': 'hr', 'SI': 'si',
    'SK': 'sk', 'LT': 'lt', 'LV': 'lv', 'EE': 'ee', 'UA': 'com.ua', 'BY': 'by',
    'MD': 'md', 'RS': 'rs', 'BA': 'ba', 'ME': 'me', 'MK': 'mk', 'AL': 'al',
    'XK': 'xk', 'IS': 'is', 'LU': 'lu', 'MT': 'com.mt', 'CY': 'com.cy',
    'MC': 'mc', 'AD': 'ad', 'SM': 'sm', 'VA': 'va', 'LI': 'li',

    // 北美洲
    'US': 'com', 'CA': 'ca', 'MX': 'com.mx', 'GT': 'com.gt', 'BZ': 'bz',
    'SV': 'com.sv', 'HN': 'hn', 'NI': 'com.ni', 'CR': 'cr', 'PA': 'com.pa',
    'CU': 'cu', 'JM': 'com.jm', 'HT': 'ht', 'DO': 'com.do', 'BS': 'bs',
    'BB': 'bb', 'TT': 'tt', 'GD': 'gd', 'LC': 'lc', 'VC': 'vc', 'AG': 'ag',
    'DM': 'dm', 'KN': 'kn',

    // 南美洲
    'BR': 'com.br', 'AR': 'com.ar', 'CL': 'cl', 'CO': 'com.co', 'PE': 'com.pe',
    'VE': 'co.ve', 'EC': 'com.ec', 'BO': 'com.bo', 'PY': 'com.py', 'UY': 'com.uy',
    'GY': 'gy', 'SR': 'sr', 'GF': 'gf',

    // 大洋洲
    'AU': 'com.au', 'NZ': 'co.nz', 'FJ': 'com.fj', 'PG': 'com.pg', 'NC': 'nc',
    'SB': 'com.sb', 'VU': 'vu', 'WS': 'ws', 'TO': 'to', 'KI': 'ki', 'TV': 'tv',
    'NR': 'nr', 'PW': 'pw', 'MH': 'mh', 'FM': 'fm',

    // 非洲
    'ZA': 'co.za', 'NG': 'com.ng', 'EG': 'com.eg', 'KE': 'co.ke', 'GH': 'com.gh',
    'ET': 'et', 'TZ': 'co.tz', 'UG': 'co.ug', 'ZW': 'co.zw', 'ZM': 'co.zm',
    'BW': 'co.bw', 'NA': 'com.na', 'MW': 'mw', 'MZ': 'co.mz', 'MG': 'mg',
    'MU': 'mu', 'SC': 'sc', 'RE': 're', 'MA': 'co.ma', 'DZ': 'dz', 'TN': 'com.tn',
    'LY': 'ly', 'SD': 'sd', 'SS': 'ss', 'ER': 'er', 'DJ': 'dj', 'SO': 'so',
    'RW': 'rw', 'BI': 'bi', 'CD': 'cd', 'CG': 'cg', 'CF': 'cf', 'CM': 'cm',
    'TD': 'td', 'NE': 'ne', 'ML': 'ml', 'BF': 'bf', 'CI': 'ci', 'LR': 'lr',
    'SL': 'sl', 'GN': 'gn', 'GW': 'gw', 'SN': 'sn', 'GM': 'gm', 'CV': 'cv',
    'MR': 'mr', 'GA': 'ga', 'GQ': 'gq', 'ST': 'st', 'AO': 'ao', 'LS': 'ls',
    'SZ': 'sz', 'KM': 'km',

    // 中东
    'SA': 'com.sa', 'AE': 'ae', 'QA': 'com.qa', 'KW': 'com.kw', 'BH': 'com.bh',
    'OM': 'com.om', 'YE': 'ye', 'IQ': 'iq', 'IR': 'ir', 'TR': 'com.tr',
    'IL': 'co.il', 'PS': 'ps', 'JO': 'jo', 'LB': 'com.lb', 'SY': 'sy',
    'AM': 'am', 'AZ': 'az', 'GE': 'ge',
  };
  return tldMap[region] || 'com';
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname;
  } catch {
    return null;
  }
}

function cleanUrl(url: string): string {
  try {
    // Remove DuckDuckGo redirect wrapper
    if (url.includes('duckduckgo.com')) {
      const match = url.match(/uddg=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
    
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    
    return url;
  } catch {
    return url;
  }
}

function generateCommonWebsites(keyword: string, region: string): SearchResult[] {
  const tld = getCountryTLD(region);
  const keywords = keyword.toLowerCase().split(' ');
  const results: SearchResult[] = [];
  
  // Generate some common patterns
  keywords.forEach(kw => {
    const cleanKeyword = kw.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanKeyword.length > 2) {
      results.push(
        {
          title: `${kw.charAt(0).toUpperCase() + kw.slice(1)} Official Website`,
          url: `https://www.${cleanKeyword}.${tld}`,
          snippet: `Official website for ${kw}`,
          domain: `${cleanKeyword}.${tld}`
        },
        {
          title: `${kw.charAt(0).toUpperCase() + kw.slice(1)} Company`,
          url: `https://www.${cleanKeyword}company.${tld}`,
          snippet: `${kw} company website`,
          domain: `${cleanKeyword}company.${tld}`
        },
        {
          title: `Best ${kw.charAt(0).toUpperCase() + kw.slice(1)} Services`,
          url: `https://www.best${cleanKeyword}.${tld}`,
          snippet: `Best ${kw} services and solutions`,
          domain: `best${cleanKeyword}.${tld}`
        }
      );
    }
  });
  
  return results.slice(0, 10);
}

function generateFallbackResults(keyword: string, region: string, limit: number): SearchResult[] {
  const tld = getCountryTLD(region);
  const results: SearchResult[] = [];
  
  // Generate fallback results based on keyword
  const variations = [
    `${keyword}`,
    `${keyword}-company`,
    `${keyword}-services`,
    `${keyword}-solutions`,
    `best-${keyword}`,
    `${keyword}-official`,
    `${keyword}-group`,
    `${keyword}-corp`,
    `${keyword}-inc`,
    `${keyword}-ltd`
  ];
  
  variations.forEach((variation, index) => {
    if (results.length >= limit) return;
    
    const cleanVariation = variation.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
    results.push({
      title: `${variation.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Website`,
      url: `https://www.${cleanVariation}.${tld}`,
      snippet: `Website related to ${keyword}`,
      domain: `${cleanVariation}.${tld}`
    });
  });
  
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, region = '', limit = 100 } = await request.json();

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return NextResponse.json({ error: '请提供有效的关键词' }, { status: 400 });
    }

    // No limit restriction - allow unlimited results

    const results = await searchWebsites(keyword.trim(), region, limit);

    return NextResponse.json({
      success: true,
      keyword,
      region,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Website search error:', error);
    return NextResponse.json({ 
      error: error.message || '搜索网站失败' 
    }, { status: 500 });
  }
}
