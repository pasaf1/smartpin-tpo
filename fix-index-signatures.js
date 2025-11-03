/**
 * Script to fix TS4111 errors: noPropertyAccessFromIndexSignature
 * Converts process.env.X to process.env['X']
 * Converts params.id to params['id']
 * Converts payload.new.X to payload.new['X']
 */

const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.next', 'dist', '.git'].includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Patterns to fix
const patterns = [
  // process.env patterns
  { regex: /process\.env\.NEXT_PUBLIC_SUPABASE_URL/g, replacement: "process.env['NEXT_PUBLIC_SUPABASE_URL']" },
  { regex: /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/g, replacement: "process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']" },
  { regex: /process\.env\.SUPABASE_SERVICE_ROLE_KEY/g, replacement: "process.env['SUPABASE_SERVICE_ROLE_KEY']" },
  { regex: /process\.env\.NEXT_PUBLIC_APP_VERSION/g, replacement: "process.env['NEXT_PUBLIC_APP_VERSION']" },

  // params patterns (common in Next.js app router)
  { regex: /params\.id([^\w])/g, replacement: "params['id']$1" },

  // payload.new patterns (Supabase realtime)
  { regex: /payload\.new\.id([^\w])/g, replacement: "payload.new['id']$1" },
  { regex: /payload\.new\.pin_id([^\w])/g, replacement: "payload.new['pin_id']$1" },
  { regex: /payload\.new\.child_pin_id([^\w])/g, replacement: "payload.new['child_pin_id']$1" },
  { regex: /payload\.new\.action([^\w])/g, replacement: "payload.new['action']$1" },
  { regex: /payload\.new\.details([^\w])/g, replacement: "payload.new['details']$1" },
  { regex: /payload\.new\.user_id([^\w])/g, replacement: "payload.new['user_id']$1" },
  { regex: /payload\.new\.user_name([^\w])/g, replacement: "payload.new['user_name']$1" },
  { regex: /payload\.new\.created_at([^\w])/g, replacement: "payload.new['created_at']$1" },

  // user.user_metadata patterns
  { regex: /user\.user_metadata\?\.name([^\w])/g, replacement: "user.user_metadata?.['name']$1" },
  { regex: /user\.user_metadata\?\.role([^\w])/g, replacement: "user.user_metadata?.['role']$1" },

  // region.metadata patterns
  { regex: /region\.metadata\?\.area([^\w])/g, replacement: "region.metadata?.['area']$1" },
  { regex: /region\.metadata\.area([^\w])/g, replacement: "region.metadata['area']$1" },

  // annotation.style patterns
  { regex: /annotation\.style\.color([^\w])/g, replacement: "annotation.style['color']$1" },
  { regex: /annotation\.style\.strokeWidth([^\w])/g, replacement: "annotation.style['strokeWidth']$1" },

  // pin patterns
  { regex: /pin\.roof_id([^\w])/g, replacement: "pin['roof_id']$1" },
];

async function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    for (const pattern of patterns) {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        changed = true;
        content = newContent;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('Fixing TS4111 errors (noPropertyAccessFromIndexSignature)...\n');

  // Find all TypeScript/TSX files
  const srcPath = path.join(__dirname, 'src');
  const files = getAllFiles(srcPath);

  console.log(`Found ${files.length} files to process\n`);

  let fixedCount = 0;
  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\nDone! Fixed ${fixedCount} files`);
}

main();
