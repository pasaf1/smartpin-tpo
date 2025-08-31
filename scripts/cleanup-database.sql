-- SmartPin TPO Database Cleanup Script
-- This script removes all static/demo data from the database

-- WARNING: This will delete ALL existing data!
-- Make sure to backup your database before running this script

BEGIN;

-- Delete all activity logs (if table exists)
-- DELETE FROM activity_logs WHERE true;

-- Delete all push subscriptions (if table exists)  
-- DELETE FROM push_subscriptions WHERE true;

-- Delete all chat messages
DELETE FROM chats WHERE true;

-- Delete all pin images
DELETE FROM pin_images WHERE true;

-- Delete all pin items
DELETE FROM pin_items WHERE true;

-- Delete all pin children
DELETE FROM pin_children WHERE true;

-- Delete all pins
DELETE FROM pins WHERE true;

-- Delete all photos
DELETE FROM photos WHERE true;

-- Delete all roofs
DELETE FROM roofs WHERE true;

-- Delete all projects
DELETE FROM projects WHERE true;

-- Reset sequences (optional - uncomment if you want to reset ID sequences)
-- ALTER SEQUENCE projects_id_seq RESTART WITH 1;
-- ALTER SEQUENCE roofs_id_seq RESTART WITH 1;
-- ALTER SEQUENCE pins_id_seq RESTART WITH 1;
-- ALTER SEQUENCE pin_items_id_seq RESTART WITH 1;
-- ALTER SEQUENCE pin_children_id_seq RESTART WITH 1;
-- ALTER SEQUENCE photos_id_seq RESTART WITH 1;
-- ALTER SEQUENCE chats_id_seq RESTART WITH 1;
-- ALTER SEQUENCE pin_images_id_seq RESTART WITH 1;

-- Keep user accounts but you can uncomment this line to delete all users except the first admin
-- DELETE FROM users WHERE id NOT IN (SELECT id FROM users ORDER BY created_at LIMIT 1);

COMMIT;

-- Verify cleanup
SELECT 'projects' as table_name, COUNT(*) as remaining_records FROM projects
UNION ALL
SELECT 'roofs' as table_name, COUNT(*) as remaining_records FROM roofs
UNION ALL
SELECT 'pins' as table_name, COUNT(*) as remaining_records FROM pins
UNION ALL
SELECT 'pin_items' as table_name, COUNT(*) as remaining_records FROM pin_items
UNION ALL
SELECT 'pin_children' as table_name, COUNT(*) as remaining_records FROM pin_children
UNION ALL
SELECT 'photos' as table_name, COUNT(*) as remaining_records FROM photos
UNION ALL
SELECT 'chats' as table_name, COUNT(*) as remaining_records FROM chats
UNION ALL
SELECT 'pin_images' as table_name, COUNT(*) as remaining_records FROM pin_images
UNION ALL
SELECT 'users' as table_name, COUNT(*) as remaining_records FROM users;