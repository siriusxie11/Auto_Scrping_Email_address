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

// Extract emails using regex
function extractEmailsFromText(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  return text.match(emailRegex) || [];
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: '请提供有效的网址' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: '网址格式无效' }, { status: 400 });
    }

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
      timeout: 10000,
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

    // Extract emails from script tags (sometimes Cloudflare emails are in scripts)
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
      // Basic email validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    });

    return NextResponse.json({
      success: true,
      url,
      emails: emailList,
      count: emailList.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Scraping error:', error);
    
    if (error.code === 'ENOTFOUND') {
      return NextResponse.json({ error: '无法访问该网址，请检查网址是否正确' }, { status: 400 });
    }
    
    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({ error: '连接被拒绝，该网站可能无法访问' }, { status: 400 });
    }
    
    if (error.response?.status === 403) {
      return NextResponse.json({ error: '访问被拒绝，该网站可能有反爬虫保护' }, { status: 400 });
    }
    
    if (error.response?.status === 404) {
      return NextResponse.json({ error: '页面不存在 (404)' }, { status: 400 });
    }
    
    if (error.code === 'ECONNABORTED') {
      return NextResponse.json({ error: '请求超时，请稍后重试' }, { status: 400 });
    }

    return NextResponse.json({ 
      error: '抓取失败，请检查网址或稍后重试',
      details: error.message 
    }, { status: 500 });
  }
} 