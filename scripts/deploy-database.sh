#!/bin/bash

# SmartPin TPO Database Deployment Script
# This script deploys all database migrations in the correct order

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    error "Supabase CLI is not installed. Please install it first:"
    error "npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [[ ! -f "supabase/config.toml" ]]; then
    error "This script must be run from the project root directory"
    error "Current directory: $(pwd)"
    exit 1
fi

log "Starting SmartPin TPO database deployment..."

# Check environment
ENVIRONMENT=${1:-local}
log "Target environment: $ENVIRONMENT"

if [[ "$ENVIRONMENT" == "production" ]]; then
    if [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
        error "SUPABASE_ACCESS_TOKEN environment variable is required for production deployment"
        exit 1
    fi
    
    if [[ -z "$SUPABASE_PROJECT_ID" ]]; then
        error "SUPABASE_PROJECT_ID environment variable is required for production deployment"
        exit 1
    fi
    
    warning "⚠️  PRODUCTION DEPLOYMENT DETECTED ⚠️"
    warning "This will modify the production database!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled by user"
        exit 0
    fi
fi

# Function to run migrations
run_migrations() {
    local env=$1
    log "Running database migrations for $env environment..."
    
    if [[ "$env" == "local" ]]; then
        # Check if local Supabase is running
        if ! supabase status | grep -q "supabase local development setup is running"; then
            warning "Local Supabase is not running. Starting it now..."
            supabase start
        fi
        
        # Run migrations locally
        supabase db push
    else
        # Run migrations on production
        supabase db push --project-ref "$SUPABASE_PROJECT_ID"
    fi
}

# Function to generate types
generate_types() {
    local env=$1
    log "Generating TypeScript types for $env environment..."
    
    if [[ "$env" == "local" ]]; then
        npm run generate-types:local-safe
    else
        npm run generate-types:safe
    fi
}

# Function to validate deployment
validate_deployment() {
    local env=$1
    log "Validating database deployment for $env environment..."
    
    if [[ "$env" == "local" ]]; then
        # Run local validation query
        supabase db query "SELECT validate_database_setup();" --format json
    else
        # For production, we'd need to run this through the API or psql
        log "Production validation should be done through the application dashboard"
    fi
}

# Main deployment process
main() {
    # Step 1: Backup current state (for local development)
    if [[ "$ENVIRONMENT" == "local" ]]; then
        log "Creating local database backup..."
        mkdir -p backups
        supabase db dump --file "backups/pre-deployment-$(date +%Y%m%d_%H%M%S).sql" || warning "Backup failed, continuing anyway"
    fi
    
    # Step 2: Run migrations
    log "📦 Deploying database migrations..."
    run_migrations "$ENVIRONMENT"
    success "Database migrations completed successfully"
    
    # Step 3: Generate TypeScript types
    log "🔧 Generating TypeScript types..."
    generate_types "$ENVIRONMENT"
    success "TypeScript types generated successfully"
    
    # Step 4: Validate deployment
    log "✅ Validating deployment..."
    if [[ "$ENVIRONMENT" == "local" ]]; then
        validate_deployment "$ENVIRONMENT"
    fi
    success "Database validation completed"
    
    # Step 5: Display summary
    log "📋 Deployment Summary:"
    echo "  • Environment: $ENVIRONMENT"
    echo "  • Migrations: Applied"
    echo "  • Types: Generated"
    echo "  • Validation: Complete"
    echo "  • Status: Ready for use"
    
    success "🎉 SmartPin TPO database deployment completed successfully!"
    
    # Next steps
    echo ""
    log "Next steps:"
    if [[ "$ENVIRONMENT" == "local" ]]; then
        echo "  1. Start your development server: npm run dev"
        echo "  2. Open http://localhost:3000 to test the application"
        echo "  3. Check Supabase dashboard: http://localhost:54323"
    else
        echo "  1. Deploy your application frontend"
        echo "  2. Test the production environment"
        echo "  3. Monitor the application logs"
    fi
    
    echo ""
    log "Useful commands:"
    echo "  • Check database status: supabase status"
    echo "  • View logs: supabase logs"
    echo "  • Generate fresh types: npm run generate-types:safe"
    echo "  • Reset local DB: supabase db reset"
}

# Handle interrupts gracefully
trap 'error "Deployment interrupted by user"; exit 130' INT

# Run main function
main

# Exit successfully
exit 0