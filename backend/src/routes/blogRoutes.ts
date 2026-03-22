import { Router, Request, Response } from 'express';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const router = Router();

// RSS Feed URL - Bonsai Tonight (high quality bonsai blog with beautiful images)
const RSS_FEED_URL = 'https://bonsaitonight.com/feed/';

interface RSSItem {
  title: string[];
  link: string[];
  pubDate: string[];
  'dc:creator'?: string[];
  creator?: string[];
  description: string[];
  'content:encoded'?: string[];
  category?: string[];
  'media:content'?: Array<{ $: { url: string } }>;
  enclosure?: Array<{ $: { url: string } }>;
}

interface BlogPost {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  author: string;
  excerpt: string;
  content: string;
  image: string;
  categories: string[];
}

const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 'post-0',
    title: 'Bonsai Watering Basics: How to Avoid Overwatering',
    link: '#',
    pubDate: new Date().toISOString(),
    author: 'Ponsai Team',
    excerpt: 'Learn the most common watering mistakes and simple ways to keep your bonsai healthy all year.',
    content: 'Learn the most common watering mistakes and simple ways to keep your bonsai healthy all year.',
    image: 'assets/images/post-1.jpg',
    categories: ['care', 'watering']
  },
  {
    id: 'post-1',
    title: 'Beginner-Friendly Bonsai Species for Indoor Spaces',
    link: '#',
    pubDate: new Date().toISOString(),
    author: 'Ponsai Team',
    excerpt: 'Discover resilient species that adapt well to apartments and office environments.',
    content: 'Discover resilient species that adapt well to apartments and office environments.',
    image: 'assets/images/post-2.jpg',
    categories: ['beginner', 'indoor']
  },
  {
    id: 'post-2',
    title: 'Repotting Calendar: When and Why It Matters',
    link: '#',
    pubDate: new Date().toISOString(),
    author: 'Ponsai Team',
    excerpt: 'A practical seasonal checklist to repot safely without stressing your tree.',
    content: 'A practical seasonal checklist to repot safely without stressing your tree.',
    image: 'assets/images/post-3.jpg',
    categories: ['repotting', 'seasonal-care']
  }
];

async function fetchRSSItems(): Promise<RSSItem[]> {
  const response = await axios.get(RSS_FEED_URL, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FurniBlog/1.0)'
    }
  });

  const result = await parseStringPromise(response.data, {
    trim: true,
    explicitArray: true
  });

  return result?.rss?.channel?.[0]?.item || [];
}

// Helper function to extract image from content
function extractImageFromContent(content: string): string {
  // Try to find image in content
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = content.match(imgRegex);
  if (match && match[1]) {
    return match[1];
  }
  return '';
}

// Helper function to strip HTML and truncate
function stripHtmlAndTruncate(html: string, maxLength: number = 150): string {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Parse RSS item to BlogPost
function parseRSSItem(item: RSSItem, index: number): BlogPost {
  const content = item['content:encoded']?.[0] || item.description?.[0] || '';
  const description = item.description?.[0] || '';
  
  // Extract image from various sources
  let image = '';
  if (item['media:content']?.[0]?.$?.url) {
    image = item['media:content'][0].$.url;
  } else if (item.enclosure?.[0]?.$?.url) {
    image = item.enclosure[0].$.url;
  } else {
    image = extractImageFromContent(content);
  }

  return {
    id: `post-${index}`,
    title: item.title?.[0] || 'Untitled',
    link: item.link?.[0] || '#',
    pubDate: item.pubDate?.[0] || new Date().toISOString(),
    author: item['dc:creator']?.[0] || item.creator?.[0] || 'Unknown',
    excerpt: stripHtmlAndTruncate(description, 150),
    content: content,
    image: image || 'assets/images/post-1.jpg',
    categories: item.category || []
  };
}

// @desc    Get blog posts from RSS feed
// @route   GET /api/v1/blog
// @access  Public
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await fetchRSSItems();
    
    // Get only first 24 items
    const limitedItems = items.slice(0, 24);
    
    // Parse items to BlogPost format
    const posts: BlogPost[] = limitedItems.map((item, index) => parseRSSItem(item, index));

    res.json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (error: any) {
    console.error('Error fetching RSS feed:', error.message);
    res.status(200).json({
      success: true,
      count: FALLBACK_POSTS.length,
      source: 'fallback',
      message: 'RSS feed is temporarily unavailable. Using fallback posts.',
      data: FALLBACK_POSTS
    });
  }
});

// @desc    Get single blog post by index
// @route   GET /api/v1/blog/:id
// @access  Public
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const postIndex = parseInt(req.params.id.replace('post-', ''), 10);

  if (Number.isNaN(postIndex)) {
    res.status(400).json({
      success: false,
      message: 'Invalid blog post id'
    });
    return;
  }

  try {
    const items = await fetchRSSItems();
    
    if (postIndex < 0 || postIndex >= items.length) {
      res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
      return;
    }

    const post = parseRSSItem(items[postIndex], postIndex);

    res.json({
      success: true,
      data: post
    });
  } catch (error: any) {
    console.error('Error fetching blog post:', error.message);
    const post = FALLBACK_POSTS[postIndex];

    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      source: 'fallback',
      message: 'RSS feed is temporarily unavailable. Using fallback post.',
      data: post
    });
  }
});

export default router;
