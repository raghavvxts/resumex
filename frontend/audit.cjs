const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Allowed spacing values in tailwind.config.ts
// 0, 0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 24
// 0px, 2px, 4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 64px, 96px

const spacingMap = {
  '1.5': '2',
  '2.5': '3',
  '3.5': '4',
  '5': '6',
  '7': '8',
  '9': '8',
  '11': '12',
  '14': '16',
  '20': '24',
  '32': '24', // Caps at 24 for standard spacing, maybe?
  // We'll replace p-5 with p-6, gap-5 with gap-6, etc.
};

const radiusMap = {
  'xl': 'xl',
  '2xl': 'xl',
  '3xl': 'xl',
};

const textMap = {
  'text-[8px]': 'text-caption',
  'text-[9px]': 'text-caption',
  'text-[10px]': 'text-caption',
  'text-[11px]': 'text-caption',
  'text-[12px]': 'text-label',
  'text-[13px]': 'text-body-sm',
  'text-[14px]': 'text-body-sm',
  'text-[15px]': 'text-body',
  'text-xs': 'text-label',
  'text-sm': 'text-body-sm',
  'text-base': 'text-body',
  'text-lg': 'text-heading',
  'text-xl': 'text-heading',
  'text-2xl': 'text-title',
  'text-3xl': 'text-title',
  'text-4xl': 'text-hero',
  'text-5xl': 'text-hero',
  'text-6xl': 'text-display',
};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace spacings (p-, m-, gap-, pt-, etc)
  Object.keys(spacingMap).forEach(old => {
    const newVal = spacingMap[old];
    // Regex to match exact tailwind spacing classes, e.g., p-5, gap-1.5, mt-5, !mt-5
    // Ensure it's preceded by space or quote and followed by space or quote
    const regex = new RegExp(`(?<=['"\\s]!?)(p|m|gap|top|bottom|left|right|w|h|space-x|space-y|pt|pb|pl|pr|mt|mb|ml|mr)-${old.replace('.', '\\.')}(?=['"\\s])`, 'g');
    content = content.replace(regex, `$1-${newVal}`);
  });

  // Replace arbitrary text classes
  Object.keys(textMap).forEach(old => {
    const newVal = textMap[old];
    const regex = new RegExp(`(?<=['"\\s]!?)${old.replace('[', '\\[').replace(']', '\\]')}(?=['"\\s])`, 'g');
    content = content.replace(regex, newVal);
  });
  
  // Replace elevation shadows
  content = content.replace(/shadow-elevation-1/g, 'shadow-elevation-surface');
  content = content.replace(/shadow-elevation-2/g, 'shadow-elevation-floating');
  content = content.replace(/shadow-elevation-3/g, 'shadow-elevation-elevated');
  content = content.replace(/shadow-elevation-4/g, 'shadow-elevation-hero');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
  }
});
