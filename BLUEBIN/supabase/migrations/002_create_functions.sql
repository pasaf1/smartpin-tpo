-- Custom functions for SmartPin TPO
-- UUIDv7 provides time-ordered UUIDs for better database performance

CREATE OR REPLACE FUNCTION uuid_v7() RETURNS uuid AS $$
DECLARE
  unix_ts_ms bigint;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms = (extract(epoch from clock_timestamp()) * 1000)::bigint;
  uuid_bytes = '\x00000000000000000000000000000000';
  uuid_bytes = set_byte(uuid_bytes, 0, (unix_ts_ms >> 40)::int);
  uuid_bytes = set_byte(uuid_bytes, 1, (unix_ts_ms >> 32)::int);
  uuid_bytes = set_byte(uuid_bytes, 2, (unix_ts_ms >> 24)::int);
  uuid_bytes = set_byte(uuid_bytes, 3, (unix_ts_ms >> 16)::int);
  uuid_bytes = set_byte(uuid_bytes, 4, (unix_ts_ms >> 8)::int);
  uuid_bytes = set_byte(uuid_bytes, 5, unix_ts_ms::int);
  uuid_bytes = set_byte(uuid_bytes, 6, ((get_byte(uuid_bytes, 6) & 15) | 112)::int);
  uuid_bytes = overlay(uuid_bytes placing gen_random_bytes(8) from 9);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$ LANGUAGE plpgsql;

-- Helper function for getting user role in RLS policies
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;