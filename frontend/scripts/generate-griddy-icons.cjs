const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const icons = require('griddy-icons');

const iconEntries = {
  // Bootstrap icon bridge
  'arrow-left': { icon: 'ArrowLeft' },
  'arrow-repeat': { icon: 'Refresh' },
  'bank': { icon: 'Bank' },
  'cart-plus': { icon: 'ShoppingBasketPlus' },
  'cart-x': { icon: 'ShoppingBasketOff' },
  'check-circle': { icon: 'CheckCircle' },
  'check-circle-fill': { icon: 'CheckCircle', filled: true },
  'chevron-down': { icon: 'ChevronDown' },
  'chevron-up': { icon: 'ChevronUp' },
  'clipboard': { icon: 'Clipboard' },
  'clock': { icon: 'Time' },
  'clock-history': { icon: 'TimeBack' },
  'credit-card': { icon: 'CreditCard' },
  'crosshair': { icon: 'LocationMy' },
  'envelope-fill': { icon: 'Email', filled: true },
  'exclamation-circle': { icon: 'AlertCircle' },
  'exclamation-triangle': { icon: 'AlertTriangle' },
  'exclamation-triangle-fill': { icon: 'AlertTriangle', filled: true },
  'files': { icon: 'Files' },
  'geo-alt-fill': { icon: 'LocationPin', filled: true },
  'info-circle': { icon: 'InfoCircle' },
  'list': { icon: 'ListBulleted' },
  'lock': { icon: 'Lock' },
  'lock-fill': { icon: 'Lock', filled: true },
  'piggy-bank': { icon: 'PiggyBank' },
  'receipt': { icon: 'Receipt' },
  'shield-check': { icon: 'ShieldCheck' },
  'shop': { icon: 'Store' },
  'star': { icon: 'Star' },
  'star-fill': { icon: 'Star', filled: true },
  'tag-fill': { icon: 'Tag', filled: true },
  'telephone-fill': { icon: 'Phone', filled: true },
  'trash': { icon: 'Trash' },
  'truck': { icon: 'Truck' },
  'x-lg': { icon: 'Close' },

  // Font Awesome bridge
  'fa-paper-plane': { icon: 'Send' },
  'fa-facebook-f': { icon: 'Facebook' },
  'fa-twitter': { icon: 'Twitter' },
  'fa-instagram': { icon: 'Instagram' },
  'fa-linkedin': { icon: 'Linkedin' },
  'fa-chevron-left': { icon: 'ChevronLeft' },
  'fa-chevron-right': { icon: 'ChevronRight' },

  // Existing utility classes
  'icon-cross': { icon: 'Close' },

  // Admin layout icon set
  'admin-logo': { icon: 'Sparks' },
  'admin-dashboard': { icon: 'Layout' },
  'admin-products': { icon: 'Package' },
  'admin-categories': { icon: 'ClipboardList' },
  'admin-inventory': { icon: 'Layers' },
  'admin-orders': { icon: 'ShoppingBasket' },
  'admin-users': { icon: 'Users' },
  'admin-promotions': { icon: 'Sale' },
  'admin-analytics': { icon: 'ChartLine' },
  'admin-forecast': { icon: 'TrendUp' },
  'admin-audit': { icon: 'FileText' },
  'admin-settings': { icon: 'Settings' },
  'admin-menu': { icon: 'Menu' },
  'admin-search': { icon: 'Search' },
  'admin-notification': { icon: 'Notification' },
  'admin-apps': { icon: 'Apps' },
  'admin-theme': { icon: 'Sun' },
  'admin-chevron-down': { icon: 'ChevronDown' },

  // Generic UI token set (emoji/text icon replacement)
  'ui-edit': { icon: 'Edit' },
  'ui-pause': { icon: 'Pause' },
  'ui-play': { icon: 'Play' },
  'ui-delete': { icon: 'Trash' },
  'ui-random': { icon: 'Apps' },
  'ui-warning': { icon: 'AlertTriangle' },
  'ui-alert': { icon: 'AlertCircle' },
  'ui-success': { icon: 'CheckCircle' },
  'ui-trend-up': { icon: 'TrendUp' },
  'ui-trend-down': { icon: 'TrendDown' },
  'ui-target': { icon: 'LocationMy' },
  'ui-spark': { icon: 'LightbulbOn' },
  'ui-thumbs-up': { icon: 'ThumbsUp' },
  'ui-rocket': { icon: 'Rocket' },
  'ui-reset': { icon: 'Refresh' },
  'ui-chart': { icon: 'ChartLineUp' },
  'ui-forecast': { icon: 'Explore' },
  'ui-book': { icon: 'BookOpen' },
  'ui-calendar': { icon: 'CalendarCheck' },
  'ui-lab': { icon: 'AtomEditor' },
  'ui-chevron-down': { icon: 'ChevronDown' },
  'ui-chevron-up': { icon: 'ChevronUp' },
  'ui-chevron-right': { icon: 'ChevronRight' },
  'ui-sort': { icon: 'ListBulleted' },
  'ui-close': { icon: 'Close' }
};

const outputDir = path.resolve(__dirname, '../src/assets/griddy-icons');
const stylesOutputFile = path.resolve(__dirname, '../src/assets/styles/_griddy-icons.scss');
fs.mkdirSync(outputDir, { recursive: true });

const manifest = {};
const missing = [];

for (const [token, config] of Object.entries(iconEntries)) {
  const rawExport = icons[config.icon];
  const IconComponent = rawExport?.default?.default || rawExport?.default || rawExport;

  if (!IconComponent) {
    missing.push({ token, icon: config.icon });
    continue;
  }

  const svg = renderToStaticMarkup(
    React.createElement(IconComponent, {
      size: 24,
      filled: !!config.filled,
      color: 'currentColor'
    })
  );

  const optimized = svg
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim();

  const fileName = `${token}.svg`;
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, optimized + '\n', 'utf8');
  manifest[token] = `assets/griddy-icons/${fileName}`;
}

fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

const toSelector = (token) => {
  if (token.startsWith('fa-')) {
    return `.fa.${token}`;
  }

  if (token === 'icon-cross') {
    return '.icon-cross';
  }

  return `.bi.bi-${token}`;
};

const mappingLines = Object.keys(manifest)
  .sort()
  .map((token) => {
    const file = manifest[token].replace(/^assets\//, '/assets/');
    const selectorList = [toSelector(token), `.gi.gi-${token}`];
    const selectors = selectorList.join(',\n');
    const beforeSelectors = selectorList.map((selector) => `${selector}::before`).join(',\n');

    return `${selectors} {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 1em;\n  height: 1em;\n  color: currentColor;\n  vertical-align: -0.125em;\n  line-height: 1;\n}\n\n${beforeSelectors} {\n  @extend %griddy-icon-mask;\n  --griddy-icon: url('${file}');\n}`;
  });

const scss = `// AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Generated by scripts/generate-griddy-icons.cjs

%griddy-icon-mask {
  content: '';
  display: inline-block;
  width: 1em;
  height: 1em;
  background-color: currentColor;
  -webkit-mask-image: var(--griddy-icon);
  mask-image: var(--griddy-icon);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-position: center;
  mask-position: center;
}

.bi[class*='bi-'],
.fa[class*='fa-'],
.icon-cross,
.gi {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  color: currentColor;
  vertical-align: -0.125em;
  line-height: 1;
}

${mappingLines.join('\n\n')}
`;

fs.writeFileSync(stylesOutputFile, scss, 'utf8');

if (missing.length) {
  console.warn('[griddy] Missing icon exports:');
  console.warn(JSON.stringify(missing, null, 2));
  process.exitCode = 1;
} else {
  console.log(`[griddy] Generated ${Object.keys(manifest).length} icons at ${outputDir}`);
}
