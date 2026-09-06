import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FORMATS } from '../src/converters/index';
import { dict } from '../src/i18n';

// Because this runs after `vite build`, `dist/index.html` must exist.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

const LANGUAGES = ['en', 'ru', 'pt'] as const;
type Lang = typeof LANGUAGES[number];

function getUrlPath(lang: Lang, source: string, target: string) {
  const formatPart = `${source}-to-${target}`;
  if (lang === 'en') return `/${formatPart}/`;
  return `/${lang}/${formatPart}/`;
}

function translate(lang: Lang, key: string, params?: Record<string, string>) {
  let str = dict[lang]?.[key] || dict['en'][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`{${k}}`, 'g'), v);
    });
  }
  return str;
}

let generatedCount = 0;

console.log('Starting SSG generation for SEO...');

FORMATS.forEach((format) => {
  format.targets.forEach((target) => {
    // We generate a page for each language
    LANGUAGES.forEach((lang) => {
      const urlPath = getUrlPath(lang, format.id, target);
      const outDir = path.join(DIST_DIR, urlPath);
      
      // Create output directory
      fs.mkdirSync(outDir, { recursive: true });

      const title = translate(lang, 'conversionFrom', { 
        source: format.extension.toUpperCase(), 
        target: target.toUpperCase() 
      }) + ' — ' + translate(lang, 'title');
      
      const description = translate(lang, 'conversionDesc', {
        name: format.name,
        ext: format.extension.toUpperCase(),
        target: target.toUpperCase()
      });

      // Generate hreflang links
      const hrefLangs = LANGUAGES.map(l => {
        const u = getUrlPath(l, format.id, target);
        // Assuming your production domain is https://fastvtt.com or similar. 
        // We will just use relative absolute paths or a dummy domain for now, 
        // but for true SEO a full domain is usually needed. We will use relative here which is acceptable by some spiders, 
        // or a placeholder domain that the user can replace.
        const domain = 'https://example.com';
        return `<link rel="alternate" hreflang="${l}" href="${domain}${u}" />`;
      }).join('\n  ');
      
      const xDefault = `<link rel="alternate" hreflang="x-default" href="https://example.com${getUrlPath('en', format.id, target)}" />`;

      // Inject SEO content directly into HTML so it exists before JS hydrates
      // We will inject a hidden div with the H1 and FAQ content.
      const faqQ1 = translate(lang, 'faqQ1', { ext: format.extension.toUpperCase() });
      const faqA1 = translate(lang, 'faqA1', { ext: format.extension.toUpperCase() });
      const faqQ2 = translate(lang, 'faqQ2', { source: format.extension.toUpperCase(), target: target.toUpperCase() });
      const faqA2 = translate(lang, 'faqA2', { source: format.extension.toUpperCase(), target: target.toUpperCase() });

      const seoContent = `
        <div id="seo-content" style="display:none;">
          <h1>${translate(lang, 'conversionFrom', { source: format.extension.toUpperCase(), target: target.toUpperCase() })}</h1>
          <p>${description}</p>
          <h2>${translate(lang, 'faqTitle')}</h2>
          <h3>${faqQ1}</h3>
          <p>${faqA1}</p>
          <h3>${faqQ2}</h3>
          <p>${faqA2}</p>
        </div>
      `;

      let html = baseHtml
        .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
        .replace(/<meta name="description".*?>/i, `<meta name="description" content="${description}">`)
        .replace('</head>', `  ${hrefLangs}\n  ${xDefault}\n</head>`)
        .replace('<body>', `<body>\n${seoContent}`);

      // Ensure asset paths work from subdirectories. Vite build defaults to relative or root. 
      // If vite.config.ts base is '/', it's absolute, which works everywhere.
      
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
      generatedCount++;
    });
  });
});

console.log(`Successfully generated ${generatedCount} static HTML pages for SEO!`);
