import express from 'express';
import Blog from '../models/Blog.js';
import Event from '../models/Event.js';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/sitemap - Generate sitemap XML
router.get('/', async (req, res) => {
  try {
    const baseUrl = 'https://cindyclinc-app.vercel.app';
    const currentDate = new Date().toISOString().split('T')[0];

    // Static pages
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/contact', priority: '0.8', changefreq: 'monthly' },
      { url: '/shop', priority: '0.9', changefreq: 'weekly' },
      { url: '/shop/frames', priority: '0.9', changefreq: 'weekly' },
      { url: '/shop/lenses', priority: '0.9', changefreq: 'weekly' },
      { url: '/shop/eyedrop', priority: '0.9', changefreq: 'weekly' },
      { url: '/shop/accessories', priority: '0.9', changefreq: 'weekly' },
      { url: '/appointment', priority: '0.8', changefreq: 'monthly' },
      { url: '/blog', priority: '0.9', changefreq: 'weekly' },
      { url: '/events', priority: '0.9', changefreq: 'weekly' },
      { url: '/location/abuja', priority: '0.8', changefreq: 'monthly' },
      { url: '/services/eye-examination', priority: '0.8', changefreq: 'monthly' },
      { url: '/services/prescription-glasses', priority: '0.8', changefreq: 'monthly' },
      { url: '/services/contact-lenses', priority: '0.8', changefreq: 'monthly' },
      { url: '/services/eye-drops', priority: '0.8', changefreq: 'monthly' },
      { url: '/faqs', priority: '0.9', changefreq: 'monthly' },
      { url: '/near-me', priority: '0.9', changefreq: 'weekly' },
      { url: '/eye-care-guide', priority: '0.8', changefreq: 'monthly' },
    ];

    // Get dynamic pages
    const [blogs, events, products] = await Promise.all([
      Blog.find({ published: true }).select('slug updatedAt').lean(),
      Event.find({ published: true }).select('slug updatedAt').lean(),
      Product.find({ inStock: true }).select('_id category').lean(),
    ]);

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

    // Add static pages
    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });

    // Add blog posts
    blogs.forEach(blog => {
      const lastmod = blog.updatedAt ? new Date(blog.updatedAt).toISOString().split('T')[0] : currentDate;
      sitemap += `  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // Add events
    events.forEach(event => {
      const lastmod = event.updatedAt ? new Date(event.updatedAt).toISOString().split('T')[0] : currentDate;
      sitemap += `  <url>
    <loc>${baseUrl}/events/${event.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    });

    // Add product pages (optional - if you want individual product pages)
    // products.forEach(product => {
    //   sitemap += `  <url>
    //     <loc>${baseUrl}/shop/${product.category}/${product._id}</loc>
    //     <lastmod>${currentDate}</lastmod>
    //     <changefreq>weekly</changefreq>
    //     <priority>0.6</priority>
    //   </url>\n`;
    // });

    sitemap += '</urlset>';

    res.set('Content-Type', 'text/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
});

export default router;

