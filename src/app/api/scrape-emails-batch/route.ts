import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Cloudflare email decoding function
function decodeCloudflareEmail(encodedString: string): string {
  const key = parseInt(encodedString.substr(0, 2), 16);
  let email = '';
  for (let i = 2; i < encodedString.length; i += 2) {
    const charCode = parseInt(encodedString.substr(i, 2), 16) ^ key;
    email += String.fromCharCode(charCode);
  }
  return email;
}

// Extract emails from text using regex
function extractEmailsFromText(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.match(emailRegex) || [];
}

// Single URL scraping function
async function scrapeEmailsFromUrl(url: string) {
  try {
    // Validate URL format
    new URL(url);

    // Configure axios with browser-like headers
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      timeout: 15000, // 增加超时时间到15秒
      maxRedirects: 5,
    });

    const $ = cheerio.load(response.data);
    const emails = new Set<string>();

    // Extract regular emails from text content
    const pageText = $('body').text();
    const regularEmails = extractEmailsFromText(pageText);
    regularEmails.forEach(email => emails.add(email.toLowerCase()));

    // Extract emails from href attributes
    $('a[href^="mailto:"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0];
        if (email) {
          emails.add(email.toLowerCase());
        }
      }
    });

    // Extract Cloudflare protected emails
    $('a.__cf_email__').each((_, element) => {
      const encodedEmail = $(element).attr('data-cfemail');
      if (encodedEmail) {
        try {
          const decodedEmail = decodeCloudflareEmail(encodedEmail);
          if (decodedEmail && decodedEmail.includes('@')) {
            emails.add(decodedEmail.toLowerCase());
          }
        } catch (error) {
          console.warn('Failed to decode Cloudflare email:', encodedEmail);
        }
      }
    });

    // Extract emails from script tags
    $('script').each((_, element) => {
      const scriptContent = $(element).html();
      if (scriptContent && scriptContent.includes('data-cfemail')) {
        const cfEmailMatches = scriptContent.match(/data-cfemail="([^"]+)"/g);
        if (cfEmailMatches) {
          cfEmailMatches.forEach(match => {
            const encodedEmail = match.match(/data-cfemail="([^"]+)"/)?.[1];
            if (encodedEmail) {
              try {
                const decodedEmail = decodeCloudflareEmail(encodedEmail);
                if (decodedEmail && decodedEmail.includes('@')) {
                  emails.add(decodedEmail.toLowerCase());
                }
              } catch (error) {
                console.warn('Failed to decode Cloudflare email from script:', encodedEmail);
              }
            }
          });
        }
      }
    });

    // Convert Set to Array and filter out invalid emails
    const emailList = Array.from(emails).filter(email => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    });

    return {
      success: true,
      url,
      emails: emailList,
      count: emailList.length,
      timestamp: new Date().toISOString(),
    };

  } catch (error: any) {
    return {
      success: false,
      url,
      emails: [],
      count: 0,
      timestamp: new Date().toISOString(),
      error: error.message || '抓取失败',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: '请提供有效的网址列表' }, { status: 400 });
    }

    if (urls.length > 50) {
      return NextResponse.json({ error: '一次最多支持抓取50个网址' }, { status: 400 });
    }

    const startTime = Date.now();
    const results = [];
    const allEmails = new Set<string>();

    // 处理每个URL
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i].trim();
      
      if (!url) continue;
      
      // Add protocol if missing
      let processedUrl = url;
      if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
        processedUrl = 'https://' + processedUrl;
      }

      const result = await scrapeEmailsFromUrl(processedUrl);
      results.push(result);

      // 收集所有邮箱
      if (result.success) {
        result.emails.forEach(email => allEmails.add(email));
      }

      // 添加小延迟避免被反爬虫
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    const uniqueEmails = Array.from(allEmails);

    return NextResponse.json({
      success: true,
      results,
      totalEmails: uniqueEmails,
      uniqueEmailCount: uniqueEmails.length,
      successCount,
      failureCount,
      duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Batch scraping error:', error);
    return NextResponse.json({ 
      error: error.message || '批量抓取失败' 
    }, { status: 500 });
  }
} 