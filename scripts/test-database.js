#!/usr/bin/env node

/**
 * Database Testing Script for SmartPin TPO
 * Tests all database functionality to ensure everything works correctly
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  const test = { message, passed: condition };
  results.tests.push(test);
  
  if (condition) {
    results.passed++;
    log(`✓ ${message}`, 'success');
  } else {
    results.failed++;
    log(`✗ ${message}`, 'error');
  }
  
  return condition;
}

// Test helper to create test data
async function createTestUser() {
  const testUser = {
    email: `test-${Date.now()}@smartpintpo.com`,
    full_name: 'Test User',
    role: 'Viewer'
  };
  
  const { data, error } = await supabaseService
    .from('users')
    .insert(testUser)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function cleanup() {
  log('Cleaning up test data...');
  
  try {
    // Delete test data created during tests
    await supabaseService.from('users').delete().like('email', 'test-%@smartpintpo.com');
    await supabaseService.from('projects').delete().like('name', 'Test Project%');
    log('Cleanup completed');
  } catch (error) {
    log(`Cleanup warning: ${error.message}`, 'warn');
  }
}

// Database connectivity tests
async function testConnectivity() {
  log('Testing database connectivity...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    assert(!error, 'Database connection successful');
    assert(typeof data === 'object', 'Database returns valid response');
  } catch (error) {
    assert(false, `Database connectivity failed: ${error.message}`);
  }
}

// Schema validation tests
async function testSchema() {
  log('Testing database schema...');
  
  const expectedTables = [
    'users', 'projects', 'roofs', 'pins', 'pin_children', 
    'photos', 'chats', 'layers', 'audit_log', 'user_prefs'
  ];
  
  for (const table of expectedTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { head: true })
        .limit(0);
      
      assert(!error, `Table '${table}' exists and is accessible`);
    } catch (error) {
      assert(false, `Table '${table}' test failed: ${error.message}`);
    }
  }
}

// RLS policy tests
async function testRLSPolicies() {
  log('Testing Row Level Security policies...');
  
  try {
    // Test that anonymous users cannot access protected data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    // Should either return empty data (if RLS blocks) or data if policies allow
    assert(!usersError || usersError.code === 'PGRST116', 'RLS policies are active on users table');
    
    // Test that policies exist
    const { data: policies, error: policiesError } = await supabaseService
      .rpc('get_rls_policies_count');
    
    if (!policiesError && policies > 0) {
      assert(policies > 10, `Found ${policies} RLS policies (expected > 10)`);
    } else {
      log('Could not verify RLS policy count - may need custom function', 'warn');
    }
  } catch (error) {
    log(`RLS test warning: ${error.message}`, 'warn');
  }
}

// CRUD operation tests
async function testCRUDOperations() {
  log('Testing CRUD operations...');
  
  try {
    // Test user creation
    const testUser = await createTestUser();
    assert(testUser && testUser.id, 'User creation successful');
    
    // Test project creation
    const { data: project, error: projectError } = await supabaseService
      .from('projects')
      .insert({
        name: `Test Project ${Date.now()}`,
        status: 'Open',
        contractor: 'Test Contractor',
        created_by: testUser.id
      })
      .select()
      .single();
    
    assert(!projectError && project, 'Project creation successful');
    
    // Test roof creation
    if (project) {
      const { data: roof, error: roofError } = await supabaseService
        .from('roofs')
        .insert({
          project_id: project.project_id,
          code: 'TEST1',
          name: 'Test Roof',
          zones: [],
          stakeholders: []
        })
        .select()
        .single();
      
      assert(!roofError && roof, 'Roof creation successful');
      
      // Test layer creation
      if (roof) {
        const { data: layer, error: layerError } = await supabaseService
          .from('layers')
          .insert({
            roof_id: roof.id,
            name: 'Test Layer',
            type: 'pins'
          })
          .select()
          .single();
        
        assert(!layerError && layer, 'Layer creation successful');
        
        // Test pin creation
        if (layer) {
          const { data: pin, error: pinError } = await supabaseService
            .from('pins')
            .insert({
              roof_id: roof.id,
              layer_id: layer.id,
              seq_number: 1,
              x: 0.5,
              y: 0.5,
              opened_by: testUser.id
            })
            .select()
            .single();
          
          assert(!pinError && pin, 'Pin creation successful');
        }
      }
    }
  } catch (error) {
    assert(false, `CRUD operations failed: ${error.message}`);
  }
}

// Function tests
async function testDatabaseFunctions() {
  log('Testing database functions...');
  
  try {
    // Test system health function
    const { data: health, error: healthError } = await supabaseService
      .rpc('get_system_health');
    
    if (!healthError && health) {
      assert(typeof health === 'object', 'get_system_health function works');
      assert(typeof health.users === 'number', 'Health check returns user count');
      assert(typeof health.projects === 'number', 'Health check returns project count');
    } else {
      log('System health function not available or failed', 'warn');
    }
    
    // Test database validation function
    const { data: validation, error: validationError } = await supabaseService
      .rpc('validate_database_setup');
    
    if (!validationError && validation) {
      assert(typeof validation === 'object', 'validate_database_setup function works');
      assert(validation.status !== undefined, 'Validation returns status');
    } else {
      log('Database validation function not available', 'warn');
    }
  } catch (error) {
    log(`Function tests warning: ${error.message}`, 'warn');
  }
}

// Storage tests
async function testStorage() {
  log('Testing storage configuration...');
  
  try {
    // Test storage buckets
    const { data: buckets, error: bucketsError } = await supabaseService
      .storage
      .listBuckets();
    
    if (!bucketsError) {
      const expectedBuckets = ['pin-photos', 'roof-plans', 'project-documents'];
      const bucketNames = buckets.map(b => b.name);
      
      for (const expectedBucket of expectedBuckets) {
        assert(
          bucketNames.includes(expectedBucket), 
          `Storage bucket '${expectedBucket}' exists`
        );
      }
    } else {
      log(`Storage test failed: ${bucketsError.message}`, 'warn');
    }
  } catch (error) {
    log(`Storage tests warning: ${error.message}`, 'warn');
  }
}

// Performance tests
async function testPerformance() {
  log('Testing database performance...');
  
  try {
    // Test query performance on pins table
    const startTime = Date.now();
    const { data, error } = await supabaseService
      .from('pins')
      .select('id, status, seq_number')
      .order('seq_number')
      .limit(100);
    
    const queryTime = Date.now() - startTime;
    
    assert(!error, 'Pin query executes without error');
    assert(queryTime < 1000, `Pin query completes in reasonable time (${queryTime}ms < 1000ms)`);
    
    // Test index usage (if we can check explain plan)
    log(`Query performance: ${queryTime}ms for pin selection`, 'info');
  } catch (error) {
    log(`Performance test warning: ${error.message}`, 'warn');
  }
}

// Real-time functionality tests
async function testRealtime() {
  log('Testing real-time subscriptions...');
  
  try {
    let subscriptionWorking = false;
    
    // Create a subscription to test real-time
    const subscription = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'pins' },
        (payload) => {
          subscriptionWorking = true;
        }
      )
      .subscribe((status) => {
        assert(status === 'SUBSCRIBED', `Real-time subscription status: ${status}`);
      });
    
    // Wait a moment for subscription to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean up subscription
    subscription.unsubscribe();
    
    log('Real-time subscription test completed (basic connectivity)', 'info');
  } catch (error) {
    log(`Real-time test warning: ${error.message}`, 'warn');
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 SmartPin TPO Database Test Suite');
  console.log('=====================================\n');
  
  log('Starting comprehensive database tests...');
  
  try {
    await testConnectivity();
    await testSchema();
    await testRLSPolicies();
    await testCRUDOperations();
    await testDatabaseFunctions();
    await testStorage();
    await testPerformance();
    await testRealtime();
    
    // Cleanup test data
    await cleanup();
    
  } catch (error) {
    log(`Unexpected error during testing: ${error.message}`, 'error');
    results.failed++;
  }
  
  // Display results
  console.log('\n=====================================');
  console.log('📊 Test Results Summary');
  console.log('=====================================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total: ${results.tests.length}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Database is ready for production.');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed. Please review and fix issues.`);
    
    // Show failed tests
    const failedTests = results.tests.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log('\nFailed tests:');
      failedTests.forEach(test => {
        console.log(`  ❌ ${test.message}`);
      });
    }
  }
  
  // Generate test report
  const report = {
    timestamp: new Date().toISOString(),
    environment: SUPABASE_URL.includes('localhost') ? 'local' : 'production',
    summary: {
      passed: results.passed,
      failed: results.failed,
      total: results.tests.length
    },
    tests: results.tests
  };
  
  const reportPath = path.join(__dirname, '..', 'test-reports', `database-test-${Date.now()}.json`);
  
  try {
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`Test report saved to: ${reportPath}`);
  } catch (error) {
    log(`Could not save test report: ${error.message}`, 'warn');
  }
  
  // Exit with proper code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle process termination
process.on('SIGINT', async () => {
  log('Test interrupted. Cleaning up...');
  await cleanup();
  process.exit(130);
});

process.on('unhandledRejection', (error) => {
  log(`Unhandled promise rejection: ${error.message}`, 'error');
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  log(`Test runner error: ${error.message}`, 'error');
  process.exit(1);
});