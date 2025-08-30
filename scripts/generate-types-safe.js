#!/usr/bin/env node

/**
 * Safe type generation script for production deployment
 * Falls back gracefully when Supabase access token is not available
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for Supabase access token...');

// Check if we have access to Supabase
const hasAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectId = 'vhtbinssqbzcjmbgkseo';
const typesPath = path.join(process.cwd(), 'src/lib/database.types.ts');

if (hasAccessToken) {
  console.log('✅ Supabase access token found - generating fresh types from production');
  try {
    execSync(`npx supabase gen types typescript --project-id ${projectId} > ${typesPath}`, {
      stdio: 'inherit'
    });
    console.log('✅ Types generated successfully from production database');
  } catch (error) {
    console.error('❌ Failed to generate types from production:', error.message);
    console.log('📁 Using existing database.types.ts file');
  }
} else {
  console.log('⚠️  No Supabase access token found');
  
  // Check if types file exists
  if (fs.existsSync(typesPath)) {
    console.log('📁 Using existing database.types.ts file for deployment');
    console.log('💡 For fresh types, set SUPABASE_ACCESS_TOKEN in environment variables');
  } else {
    console.error('❌ No database.types.ts file found and no access token available');
    console.error('🚨 This will cause TypeScript compilation errors');
    process.exit(1);
  }
}

console.log('🎯 Type generation process completed');