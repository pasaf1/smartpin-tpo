-- Enable required extensions for SmartPin TPO
-- PostGIS for spatial data, UUID for unique identifiers, trigram for text search

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search optimization