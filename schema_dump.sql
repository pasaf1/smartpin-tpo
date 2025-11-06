Initialising login role...
Dumping schemas from remote database...


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."defect_layer" AS ENUM (
    'VaporBarrier',
    'InsulationBoards',
    'DensDeck',
    'TPO_Membrane',
    'Seams',
    'Flashing',
    'Drains',
    'Curbs'
);


ALTER TYPE "public"."defect_layer" OWNER TO "postgres";


CREATE TYPE "public"."image_kind" AS ENUM (
    'Open',
    'Close',
    'Extra'
);


ALTER TYPE "public"."image_kind" OWNER TO "postgres";


CREATE TYPE "public"."pin_status" AS ENUM (
    'Open',
    'ReadyForInspection',
    'Closed'
);


ALTER TYPE "public"."pin_status" OWNER TO "postgres";


CREATE TYPE "public"."role" AS ENUM (
    'Admin',
    'QA_Manager',
    'Supervisor',
    'Foreman',
    'Viewer'
);


ALTER TYPE "public"."role" OWNER TO "postgres";


CREATE TYPE "public"."severity" AS ENUM (
    'Low',
    'Medium',
    'High',
    'Critical'
);


ALTER TYPE "public"."severity" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_parent_pin_status"("child_pins" "jsonb") RETURNS "public"."pin_status"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    total_count INTEGER;
    open_count INTEGER;
    ready_count INTEGER;
    closed_count INTEGER;
BEGIN
    -- Extract counts from JSONB parameter
    total_count := (child_pins->>'total')::INTEGER;
    open_count := (child_pins->>'open')::INTEGER;
    ready_count := (child_pins->>'ready')::INTEGER;
    closed_count := (child_pins->>'closed')::INTEGER;

    -- Apply business rules
    IF total_count = 0 OR total_count = open_count THEN
        RETURN 'Open';
    ELSIF total_count = closed_count THEN
        RETURN 'Closed';
    ELSE
        RETURN 'ReadyForInspection';
    END IF;
END;
$$;


ALTER FUNCTION "public"."calculate_parent_pin_status"("child_pins" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_risk_matrix_data"("roof_id_param" "uuid" DEFAULT NULL::"uuid", "filters" "jsonb" DEFAULT NULL::"jsonb") RETURNS TABLE("defect_layer" "text", "severity" "text", "occurrence_count" bigint, "risk_score" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pc.defect_type, 'Unknown') as defect_layer,
        pc.severity::TEXT,
        COUNT(*) as occurrence_count,
        -- Simple risk scoring: Critical=4, High=3, Medium=2, Low=1
        COUNT(*) * (CASE 
            WHEN pc.severity = 'Critical' THEN 4
            WHEN pc.severity = 'High' THEN 3
            WHEN pc.severity = 'Medium' THEN 2
            WHEN pc.severity = 'Low' THEN 1
            ELSE 1
        END) as risk_score
    FROM public.pin_children pc
    JOIN public.pins p ON pc.pin_id = p.id
    JOIN public.roofs r ON p.roof_id = r.id
    WHERE 
        (roof_id_param IS NULL OR r.id = roof_id_param)
        AND pc.status_child IN ('Open', 'ReadyForInspection')
    GROUP BY pc.defect_type, pc.severity
    ORDER BY risk_score DESC, occurrence_count DESC;
END;
$$;


ALTER FUNCTION "public"."get_risk_matrix_data"("roof_id_param" "uuid", "filters" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "public"."role"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE auth_user_id = auth.uid()
        LIMIT 1
    );
END;
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, full_name, email, role, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'Viewer', -- Default role for new users
        NOW()
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (public.get_user_role() = 'Admin');
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recompute_parent_aggregates"("p_pin" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    total_children INTEGER;
    open_children INTEGER;
    ready_children INTEGER;
    closed_children INTEGER;
    mix_state TEXT;
BEGIN
    -- Count children by status
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status_child = 'Open'),
        COUNT(*) FILTER (WHERE status_child = 'ReadyForInspection'),
        COUNT(*) FILTER (WHERE status_child = 'Closed')
    INTO total_children, open_children, ready_children, closed_children
    FROM public.pin_children
    WHERE pin_id = p_pin;

    -- Determine mix state
    IF total_children = 0 THEN
        mix_state := NULL;
    ELSIF closed_children = total_children THEN
        mix_state := 'ALL_CLOSED';
    ELSIF open_children = total_children THEN
        mix_state := 'ALL_OPEN';
    ELSE
        mix_state := 'MIXED';
    END IF;

    -- Update parent pin aggregates
    UPDATE public.pins
    SET 
        children_total = total_children,
        children_open = open_children,
        children_ready = ready_children,
        children_closed = closed_children,
        parent_mix_state = mix_state,
        last_activity_at = now()
    WHERE id = p_pin;
END;
$$;


ALTER FUNCTION "public"."recompute_parent_aggregates"("p_pin" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_parent_aggregates"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.recompute_parent_aggregates(NEW.pin_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.recompute_parent_aggregates(OLD.pin_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_parent_aggregates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_update_pin_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.pins 
        SET last_activity_at = now() 
        WHERE id = NEW.pin_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.pins 
        SET last_activity_at = now() 
        WHERE id = OLD.pin_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."trigger_update_pin_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_pin_closure"("pin_uuid" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
    open_children INTEGER;
    missing_photos INTEGER;
    validation_errors TEXT[];
BEGIN
    -- Check for open children
    SELECT COUNT(*)
    INTO open_children
    FROM public.pin_children
    WHERE pin_id = pin_uuid AND status_child = 'Open';

    -- Check for missing closure photos
    SELECT COUNT(*)
    INTO missing_photos
    FROM public.pin_children pc
    LEFT JOIN public.photos p ON pc.closurepic_id = p.photo_id
    WHERE pc.pin_id = pin_uuid 
    AND pc.status_child = 'Closed' 
    AND p.photo_id IS NULL;

    -- Build validation result
    IF open_children > 0 THEN
        validation_errors := array_append(validation_errors, 
            format('Cannot close pin: %s open children remain', open_children));
    END IF;

    IF missing_photos > 0 THEN
        validation_errors := array_append(validation_errors, 
            format('Cannot close pin: %s closed items missing closure photos', missing_photos));
    END IF;

    result := jsonb_build_object(
        'can_close', (validation_errors IS NULL OR array_length(validation_errors, 1) = 0),
        'errors', COALESCE(validation_errors, ARRAY[]::TEXT[]),
        'open_children', open_children,
        'missing_closure_photos', missing_photos
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."validate_pin_closure"("pin_uuid" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."annotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "roof_id" "uuid" NOT NULL,
    "layer_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "style" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "annotations_type_check" CHECK (("type" = ANY (ARRAY['rectangle'::"text", 'circle'::"text", 'polygon'::"text", 'polyline'::"text", 'text'::"text", 'arrow'::"text"])))
);


ALTER TABLE "public"."annotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entity" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "actor_id" "uuid",
    "diff" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chats" (
    "message_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scope" "text" NOT NULL,
    "scope_id" "uuid",
    "text" "text",
    "mentions" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chats_scope_check" CHECK (("scope" = ANY (ARRAY['global'::"text", 'roof'::"text", 'pin'::"text"])))
);


ALTER TABLE "public"."chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."child_pins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "seq" "text" NOT NULL,
    "x" numeric(6,4) NOT NULL,
    "y" numeric(6,4) NOT NULL,
    "status" "text" DEFAULT 'Open'::"text" NOT NULL,
    "zone" "text",
    "severity" "text" DEFAULT 'Medium'::"text",
    "title" "text",
    "description" "text",
    "open_pic_url" "text",
    "close_pic_url" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "child_pins_severity_check" CHECK (("severity" = ANY (ARRAY['Low'::"text", 'Medium'::"text", 'High'::"text", 'Critical'::"text"]))),
    CONSTRAINT "child_pins_status_check" CHECK (("status" = ANY (ARRAY['Open'::"text", 'ReadyForInspection'::"text", 'Closed'::"text"]))),
    CONSTRAINT "child_pins_x_check" CHECK ((("x" >= (0)::numeric) AND ("x" <= (1)::numeric))),
    CONSTRAINT "child_pins_y_check" CHECK ((("y" >= (0)::numeric) AND ("y" <= (1)::numeric)))
);


ALTER TABLE "public"."child_pins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."layers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "roof_id" "uuid" NOT NULL,
    "name" "text" DEFAULT 'Quality Control'::"text" NOT NULL,
    "type" "text" DEFAULT 'pins'::"text" NOT NULL,
    "visible" boolean DEFAULT true,
    "locked" boolean DEFAULT false,
    "z_index" integer DEFAULT 1 NOT NULL,
    "opacity" numeric(3,2) DEFAULT 1.0,
    "write_roles" "text"[] DEFAULT ARRAY['Admin'::"text", 'QA_Manager'::"text"],
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "layers_opacity_check" CHECK ((("opacity" >= (0)::numeric) AND ("opacity" <= (1)::numeric))),
    CONSTRAINT "layers_type_check" CHECK (("type" = ANY (ARRAY['base'::"text", 'pins'::"text", 'annotations'::"text", 'qa'::"text", 'measurements'::"text"])))
);


ALTER TABLE "public"."layers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photos" (
    "photo_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "file_url_public" "text" NOT NULL,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "project_id" "uuid",
    "roof_id" "uuid",
    "pin_id" "uuid",
    "child_id" "uuid",
    "file_name" "text",
    "file_size" bigint,
    "upload_type" "text",
    "thumbnail_url" "text",
    "mime_type" "text",
    "uploader" "jsonb",
    "metadata" "jsonb",
    CONSTRAINT "photos_type_check" CHECK (("type" = ANY (ARRAY['OpenPIC'::"text", 'ClosurePIC'::"text"])))
);


ALTER TABLE "public"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pin_chat" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pin_item_id" "uuid" NOT NULL,
    "author_id" "uuid",
    "message" "text",
    "mentions" "jsonb" DEFAULT '[]'::"jsonb",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pin_chat" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pin_children" (
    "child_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pin_id" "uuid" NOT NULL,
    "child_code" "text" NOT NULL,
    "zone" "text",
    "defect_type" "text",
    "severity" "public"."severity" DEFAULT 'Medium'::"public"."severity",
    "status_child" "public"."pin_status" DEFAULT 'Open'::"public"."pin_status",
    "due_date" timestamp with time zone,
    "open_date" timestamp with time zone DEFAULT "now"(),
    "closed_date" timestamp with time zone,
    "openpic_id" "uuid",
    "closurepic_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pin_children" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pin_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pin_item_id" "uuid" NOT NULL,
    "kind" "public"."image_kind" NOT NULL,
    "url" "text" NOT NULL,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."pin_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pin_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pin_id" "uuid" NOT NULL,
    "seq_suffix" integer NOT NULL,
    "status" "public"."pin_status" DEFAULT 'Open'::"public"."pin_status",
    "severity" "public"."severity" DEFAULT 'Medium'::"public"."severity",
    "defect_type" "text",
    "defect_layer" "text",
    "description" "text",
    "cause" "text",
    "corrective_action" "text",
    "preventive_action" "text",
    "contractor" "text",
    "foreman" "text",
    "opened_by" "uuid",
    "opened_at" timestamp with time zone DEFAULT "now"(),
    "sla_due_date" timestamp with time zone,
    "closed_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pin_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "roof_id" "uuid" NOT NULL,
    "seq_number" integer NOT NULL,
    "zone" "text",
    "x" numeric NOT NULL,
    "y" numeric NOT NULL,
    "status" "public"."pin_status" DEFAULT 'Open'::"public"."pin_status",
    "status_parent_manual" "public"."pin_status" DEFAULT 'Open'::"public"."pin_status",
    "group_count" integer DEFAULT 0,
    "children_total" integer DEFAULT 0,
    "children_open" integer DEFAULT 0,
    "children_ready" integer DEFAULT 0,
    "children_closed" integer DEFAULT 0,
    "parent_mix_state" "text",
    "opened_by" "uuid",
    "opened_at" timestamp with time zone DEFAULT "now"(),
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "layer_id" "uuid" NOT NULL,
    CONSTRAINT "pins_parent_mix_state_check" CHECK (("parent_mix_state" = ANY (ARRAY['ALL_OPEN'::"text", 'MIXED'::"text", 'ALL_CLOSED'::"text"])))
);


ALTER TABLE "public"."pins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plan_regions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "roof_id" "uuid" NOT NULL,
    "layer_id" "uuid",
    "name" "text" DEFAULT 'Full Roof Access'::"text" NOT NULL,
    "polygon" "public"."geometry"(Polygon,4326),
    "allowed_tools" "text"[] DEFAULT ARRAY['pin'::"text", 'annotation'::"text"] NOT NULL,
    "color" "text" DEFAULT '#3b82f6'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plan_regions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "project_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'Open'::"text",
    "contractor" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['Open'::"text", 'InProgress'::"text", 'Completed'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roofs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "building" "text",
    "plan_image_url" "text",
    "roof_plan_url" "text",
    "zones" "jsonb" DEFAULT '[]'::"jsonb",
    "stakeholders" "jsonb" DEFAULT '[]'::"jsonb",
    "origin_lat" numeric,
    "origin_lng" numeric,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roofs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_prefs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "filter_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "table_columns" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_prefs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_user_id" "uuid",
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "public"."role" DEFAULT 'Viewer'::"public"."role",
    "address" "text",
    "birth_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_parent_pin_status_summary" AS
 SELECT "id" AS "pin_id",
    "children_total",
    "children_open",
    "children_ready",
    "children_closed",
        CASE
            WHEN ("children_total" = 0) THEN (0)::numeric
            ELSE "round"(((("children_closed")::numeric / ("children_total")::numeric) * (100)::numeric), 1)
        END AS "completion_percentage",
    (("children_open" = 0) AND ("children_ready" = 0)) AS "can_be_closed"
   FROM "public"."pins" "p";


ALTER VIEW "public"."v_parent_pin_status_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_pin_items_with_parent" AS
 SELECT "pi"."id",
    "pi"."pin_id",
    "pi"."seq_suffix",
    "pi"."status",
    "pi"."severity",
    "pi"."defect_type",
    "pi"."defect_layer",
    "pi"."description",
    "pi"."cause",
    "pi"."corrective_action",
    "pi"."preventive_action",
    "pi"."contractor",
    "pi"."foreman",
    "pi"."opened_by",
    "pi"."opened_at",
    "pi"."sla_due_date",
    "pi"."closed_at",
    "pi"."last_activity_at",
    "p"."seq_number" AS "parent_seq_number",
    "p"."roof_id",
    "p"."zone" AS "pin_zone",
    "p"."x" AS "pin_x",
    "p"."y" AS "pin_y",
    "r"."code" AS "roof_code",
    "r"."name" AS "roof_name",
    "r"."building",
    "concat"("r"."code", '-', "p"."seq_number", '.', "pi"."seq_suffix") AS "display_id"
   FROM (("public"."pin_items" "pi"
     JOIN "public"."pins" "p" ON (("pi"."pin_id" = "p"."id")))
     JOIN "public"."roofs" "r" ON (("p"."roof_id" = "r"."id")));


ALTER VIEW "public"."v_pin_items_with_parent" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_pins_latest_activity" AS
 SELECT "p"."id" AS "pin_id",
    GREATEST("p"."last_activity_at", COALESCE("max"("pc"."updated_at"), "p"."opened_at")) AS "latest_activity"
   FROM ("public"."pins" "p"
     LEFT JOIN "public"."pin_children" "pc" ON (("p"."id" = "pc"."pin_id")))
  GROUP BY "p"."id", "p"."last_activity_at", "p"."opened_at";


ALTER VIEW "public"."v_pins_latest_activity" OWNER TO "postgres";


ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."child_pins"
    ADD CONSTRAINT "child_pins_parent_id_seq_key" UNIQUE ("parent_id", "seq");



ALTER TABLE ONLY "public"."child_pins"
    ADD CONSTRAINT "child_pins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."layers"
    ADD CONSTRAINT "layers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."layers"
    ADD CONSTRAINT "layers_roof_id_z_index_key" UNIQUE ("roof_id", "z_index");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("photo_id");



ALTER TABLE ONLY "public"."pin_chat"
    ADD CONSTRAINT "pin_chat_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pin_children"
    ADD CONSTRAINT "pin_children_pkey" PRIMARY KEY ("child_id");



ALTER TABLE ONLY "public"."pin_images"
    ADD CONSTRAINT "pin_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pin_items"
    ADD CONSTRAINT "pin_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pins"
    ADD CONSTRAINT "pins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plan_regions"
    ADD CONSTRAINT "plan_regions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("project_id");



ALTER TABLE ONLY "public"."roofs"
    ADD CONSTRAINT "roofs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_prefs"
    ADD CONSTRAINT "user_prefs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_annotations_roof_layer" ON "public"."annotations" USING "btree" ("roof_id", "layer_id");



CREATE INDEX "idx_audit_log_entity" ON "public"."audit_log" USING "btree" ("entity", "entity_id");



CREATE INDEX "idx_chats_scope" ON "public"."chats" USING "btree" ("scope", "scope_id");



CREATE INDEX "idx_child_pins_parent" ON "public"."child_pins" USING "btree" ("parent_id");



CREATE INDEX "idx_child_pins_status" ON "public"."child_pins" USING "btree" ("status") WHERE ("status" <> 'Closed'::"text");



CREATE INDEX "idx_layers_roof_visible" ON "public"."layers" USING "btree" ("roof_id", "visible", "z_index") WHERE ("visible" = true);



CREATE INDEX "idx_photos_child_id" ON "public"."photos" USING "btree" ("child_id");



CREATE INDEX "idx_photos_pin_id" ON "public"."photos" USING "btree" ("pin_id");



CREATE INDEX "idx_pin_children_pin_id" ON "public"."pin_children" USING "btree" ("pin_id");



CREATE INDEX "idx_pin_children_status" ON "public"."pin_children" USING "btree" ("status_child");



CREATE INDEX "idx_pins_roof_id" ON "public"."pins" USING "btree" ("roof_id");



CREATE UNIQUE INDEX "idx_pins_roof_seq" ON "public"."pins" USING "btree" ("roof_id", "seq_number");



CREATE INDEX "idx_pins_status" ON "public"."pins" USING "btree" ("status");



CREATE INDEX "idx_plan_regions_polygon" ON "public"."plan_regions" USING "gist" ("polygon");



CREATE UNIQUE INDEX "idx_roofs_project_code" ON "public"."roofs" USING "btree" ("project_id", "code");



CREATE INDEX "idx_users_auth_user_id" ON "public"."users" USING "btree" ("auth_user_id");



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."pin_children" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."user_prefs" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_pin_children_activity" AFTER INSERT OR DELETE OR UPDATE ON "public"."pin_children" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_pin_activity"();



CREATE OR REPLACE TRIGGER "trigger_pin_children_update_parent" AFTER INSERT OR DELETE OR UPDATE ON "public"."pin_children" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_update_parent_aggregates"();



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "public"."layers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."annotations"
    ADD CONSTRAINT "annotations_roof_id_fkey" FOREIGN KEY ("roof_id") REFERENCES "public"."roofs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chats"
    ADD CONSTRAINT "chats_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."child_pins"
    ADD CONSTRAINT "child_pins_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."child_pins"
    ADD CONSTRAINT "child_pins_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."pins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pin_children"
    ADD CONSTRAINT "fk_pin_children_closurepic" FOREIGN KEY ("closurepic_id") REFERENCES "public"."photos"("photo_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pin_children"
    ADD CONSTRAINT "fk_pin_children_openpic" FOREIGN KEY ("openpic_id") REFERENCES "public"."photos"("photo_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."layers"
    ADD CONSTRAINT "layers_roof_id_fkey" FOREIGN KEY ("roof_id") REFERENCES "public"."roofs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."pin_children"("child_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pin_id_fkey" FOREIGN KEY ("pin_id") REFERENCES "public"."pins"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_roof_id_fkey" FOREIGN KEY ("roof_id") REFERENCES "public"."roofs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pin_chat"
    ADD CONSTRAINT "pin_chat_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pin_chat"
    ADD CONSTRAINT "pin_chat_pin_item_id_fkey" FOREIGN KEY ("pin_item_id") REFERENCES "public"."pin_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pin_children"
    ADD CONSTRAINT "pin_children_pin_id_fkey" FOREIGN KEY ("pin_id") REFERENCES "public"."pins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pin_images"
    ADD CONSTRAINT "pin_images_pin_item_id_fkey" FOREIGN KEY ("pin_item_id") REFERENCES "public"."pin_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pin_images"
    ADD CONSTRAINT "pin_images_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pin_items"
    ADD CONSTRAINT "pin_items_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pin_items"
    ADD CONSTRAINT "pin_items_pin_id_fkey" FOREIGN KEY ("pin_id") REFERENCES "public"."pins"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pins"
    ADD CONSTRAINT "pins_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "public"."layers"("id");



ALTER TABLE ONLY "public"."pins"
    ADD CONSTRAINT "pins_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pins"
    ADD CONSTRAINT "pins_roof_id_fkey" FOREIGN KEY ("roof_id") REFERENCES "public"."roofs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_regions"
    ADD CONSTRAINT "plan_regions_layer_id_fkey" FOREIGN KEY ("layer_id") REFERENCES "public"."layers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plan_regions"
    ADD CONSTRAINT "plan_regions_roof_id_fkey" FOREIGN KEY ("roof_id") REFERENCES "public"."roofs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."roofs"
    ADD CONSTRAINT "roofs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_prefs"
    ADD CONSTRAINT "user_prefs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete chats" ON "public"."chats" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Admins can manage users" ON "public"."users" USING ("public"."is_admin"());



CREATE POLICY "Foremen and above can create pin children" ON "public"."pin_children" FOR INSERT WITH CHECK (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role", 'Supervisor'::"public"."role", 'Foreman'::"public"."role"])));



CREATE POLICY "Foremen and above can manage pin images" ON "public"."pin_images" USING (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role", 'Supervisor'::"public"."role", 'Foreman'::"public"."role"])));



CREATE POLICY "Foremen and above can manage pin items" ON "public"."pin_items" USING (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role", 'Supervisor'::"public"."role", 'Foreman'::"public"."role"])));



CREATE POLICY "Foremen and above can update pin children" ON "public"."pin_children" FOR UPDATE USING (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role", 'Supervisor'::"public"."role", 'Foreman'::"public"."role"])));



CREATE POLICY "Foremen and above can upload photos" ON "public"."photos" FOR INSERT WITH CHECK (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role", 'Supervisor'::"public"."role", 'Foreman'::"public"."role"])));



CREATE POLICY "QA Managers and Admins can create projects" ON "public"."projects" FOR INSERT WITH CHECK (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"])));



CREATE POLICY "QA Managers and Admins can manage roofs" ON "public"."roofs" USING (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"])));



CREATE POLICY "QA Managers and Admins can update projects" ON "public"."projects" FOR UPDATE USING (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"])));



CREATE POLICY "QA Managers and above can view audit log" ON "public"."audit_log" FOR SELECT USING (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"])));



CREATE POLICY "Supervisors and above can create pins" ON "public"."pins" FOR INSERT WITH CHECK (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role", 'Supervisor'::"public"."role"])));



CREATE POLICY "Supervisors and above can update pins" ON "public"."pins" FOR UPDATE USING (("public"."get_user_role"() = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role", 'Supervisor'::"public"."role"])));



CREATE POLICY "System can create audit entries" ON "public"."audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create chats" ON "public"."chats" FOR INSERT WITH CHECK (("created_by" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create child pins with parent access" ON "public"."child_pins" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."pins" "pin"
     JOIN "public"."roofs" "r" ON (("r"."id" = "pin"."roof_id")))
     JOIN "public"."projects" "p" ON (("p"."project_id" = "r"."project_id")))
  WHERE (("pin"."id" = "child_pins"."parent_id") AND (("p"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"]))))))))));



CREATE POLICY "Users can create pin chat" ON "public"."pin_chat" FOR INSERT WITH CHECK (("author_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete own chats" ON "public"."chats" FOR DELETE USING (("created_by" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage own preferences" ON "public"."user_prefs" USING (("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own chats" ON "public"."chats" FOR UPDATE USING (("created_by" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own photos" ON "public"."photos" FOR UPDATE USING (("uploaded_by" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "Users can view all profiles" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can view annotations in accessible roofs" ON "public"."annotations" FOR SELECT USING (("roof_id" IN ( SELECT "r"."id"
   FROM ("public"."roofs" "r"
     JOIN "public"."projects" "p" ON (("p"."project_id" = "r"."project_id")))
  WHERE (("p"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"])))))))));



CREATE POLICY "Users can view chats" ON "public"."chats" FOR SELECT USING (true);



CREATE POLICY "Users can view child pins via parent access" ON "public"."child_pins" FOR SELECT USING (("parent_id" IN ( SELECT "pins"."id"
   FROM (("public"."pins"
     JOIN "public"."roofs" "r" ON (("r"."id" = "pins"."roof_id")))
     JOIN "public"."projects" "p" ON (("p"."project_id" = "r"."project_id")))
  WHERE (("p"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"])))))))));



CREATE POLICY "Users can view layers in accessible roofs" ON "public"."layers" FOR SELECT USING (("roof_id" IN ( SELECT "r"."id"
   FROM ("public"."roofs" "r"
     JOIN "public"."projects" "p" ON (("p"."project_id" = "r"."project_id")))
  WHERE (("p"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"])))))))));



CREATE POLICY "Users can view photos" ON "public"."photos" FOR SELECT USING (true);



CREATE POLICY "Users can view pin chat" ON "public"."pin_chat" FOR SELECT USING (true);



CREATE POLICY "Users can view pin children" ON "public"."pin_children" FOR SELECT USING (true);



CREATE POLICY "Users can view pin images" ON "public"."pin_images" FOR SELECT USING (true);



CREATE POLICY "Users can view pin items" ON "public"."pin_items" FOR SELECT USING (true);



CREATE POLICY "Users can view pins" ON "public"."pins" FOR SELECT USING (true);



CREATE POLICY "Users can view plan regions in accessible roofs" ON "public"."plan_regions" FOR SELECT USING (("roof_id" IN ( SELECT "r"."id"
   FROM ("public"."roofs" "r"
     JOIN "public"."projects" "p" ON (("p"."project_id" = "r"."project_id")))
  WHERE (("p"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."users" "u"
          WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['Admin'::"public"."role", 'QA_Manager'::"public"."role"])))))))));



CREATE POLICY "Users can view projects" ON "public"."projects" FOR SELECT USING (true);



CREATE POLICY "Users can view roofs" ON "public"."roofs" FOR SELECT USING (true);



ALTER TABLE "public"."annotations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."child_pins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."layers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pin_chat" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pin_children" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pin_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pin_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plan_regions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roofs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_prefs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_parent_pin_status"("child_pins" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_parent_pin_status"("child_pins" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_parent_pin_status"("child_pins" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_risk_matrix_data"("roof_id_param" "uuid", "filters" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."get_risk_matrix_data"("roof_id_param" "uuid", "filters" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_risk_matrix_data"("roof_id_param" "uuid", "filters" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recompute_parent_aggregates"("p_pin" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recompute_parent_aggregates"("p_pin" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recompute_parent_aggregates"("p_pin" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_parent_aggregates"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_parent_aggregates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_parent_aggregates"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_update_pin_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_update_pin_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_update_pin_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_pin_closure"("pin_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_pin_closure"("pin_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_pin_closure"("pin_uuid" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."annotations" TO "anon";
GRANT ALL ON TABLE "public"."annotations" TO "authenticated";
GRANT ALL ON TABLE "public"."annotations" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."chats" TO "anon";
GRANT ALL ON TABLE "public"."chats" TO "authenticated";
GRANT ALL ON TABLE "public"."chats" TO "service_role";



GRANT ALL ON TABLE "public"."child_pins" TO "anon";
GRANT ALL ON TABLE "public"."child_pins" TO "authenticated";
GRANT ALL ON TABLE "public"."child_pins" TO "service_role";



GRANT ALL ON TABLE "public"."layers" TO "anon";
GRANT ALL ON TABLE "public"."layers" TO "authenticated";
GRANT ALL ON TABLE "public"."layers" TO "service_role";



GRANT ALL ON TABLE "public"."photos" TO "anon";
GRANT ALL ON TABLE "public"."photos" TO "authenticated";
GRANT ALL ON TABLE "public"."photos" TO "service_role";



GRANT ALL ON TABLE "public"."pin_chat" TO "anon";
GRANT ALL ON TABLE "public"."pin_chat" TO "authenticated";
GRANT ALL ON TABLE "public"."pin_chat" TO "service_role";



GRANT ALL ON TABLE "public"."pin_children" TO "anon";
GRANT ALL ON TABLE "public"."pin_children" TO "authenticated";
GRANT ALL ON TABLE "public"."pin_children" TO "service_role";



GRANT ALL ON TABLE "public"."pin_images" TO "anon";
GRANT ALL ON TABLE "public"."pin_images" TO "authenticated";
GRANT ALL ON TABLE "public"."pin_images" TO "service_role";



GRANT ALL ON TABLE "public"."pin_items" TO "anon";
GRANT ALL ON TABLE "public"."pin_items" TO "authenticated";
GRANT ALL ON TABLE "public"."pin_items" TO "service_role";



GRANT ALL ON TABLE "public"."pins" TO "anon";
GRANT ALL ON TABLE "public"."pins" TO "authenticated";
GRANT ALL ON TABLE "public"."pins" TO "service_role";



GRANT ALL ON TABLE "public"."plan_regions" TO "anon";
GRANT ALL ON TABLE "public"."plan_regions" TO "authenticated";
GRANT ALL ON TABLE "public"."plan_regions" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."roofs" TO "anon";
GRANT ALL ON TABLE "public"."roofs" TO "authenticated";
GRANT ALL ON TABLE "public"."roofs" TO "service_role";



GRANT ALL ON TABLE "public"."user_prefs" TO "anon";
GRANT ALL ON TABLE "public"."user_prefs" TO "authenticated";
GRANT ALL ON TABLE "public"."user_prefs" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_parent_pin_status_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_parent_pin_status_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_parent_pin_status_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_pin_items_with_parent" TO "anon";
GRANT ALL ON TABLE "public"."v_pin_items_with_parent" TO "authenticated";
GRANT ALL ON TABLE "public"."v_pin_items_with_parent" TO "service_role";



GRANT ALL ON TABLE "public"."v_pins_latest_activity" TO "anon";
GRANT ALL ON TABLE "public"."v_pins_latest_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."v_pins_latest_activity" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






