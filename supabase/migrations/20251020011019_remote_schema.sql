


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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.users (auth_id)
  values (new.id);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."drills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "skill_focus" "text",
    "duration_minutes" integer,
    "difficulty" "text",
    "instructions" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."drills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_plan_drills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "plan_id" "uuid",
    "drill_id" "uuid",
    "position" integer,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."practice_plan_drills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "is_global" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."practice_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shot_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "club" "text",
    "shot_type" "text" NOT NULL,
    "difficulty" "text",
    "success" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "shot_attempts_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['Base'::"text", 'Advanced'::"text"])))
);


ALTER TABLE "public"."shot_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shot_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shot_sessions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."total_sessions_summary" AS
 SELECT "s"."user_id",
    "count"("a"."id") AS "total_shots",
    "count"("a"."id") FILTER (WHERE "a"."success") AS "success_shots",
    ( SELECT "jsonb_object_agg"("sub"."club", "jsonb_build_object"('success_shots', "sub"."success_shots", 'attempts', "sub"."attempts")) AS "jsonb_object_agg"
           FROM ( SELECT "sa"."club",
                    "count"(*) AS "attempts",
                    "count"(*) FILTER (WHERE "sa"."success") AS "success_shots"
                   FROM ("public"."shot_attempts" "sa"
                     JOIN "public"."shot_sessions" "ss" ON (("ss"."id" = "sa"."session_id")))
                  WHERE (("ss"."user_id" = "s"."user_id") AND ("sa"."club" IS NOT NULL) AND ("sa"."club" <> 'Unknown'::"text"))
                  GROUP BY "sa"."club") "sub") AS "club_performance",
    ( SELECT "jsonb_object_agg"("sub"."shot_type", "jsonb_build_object"('success_shots', "sub"."success_shots", 'attempts', "sub"."attempts")) AS "jsonb_object_agg"
           FROM ( SELECT "sa"."shot_type",
                    "count"(*) AS "attempts",
                    "count"(*) FILTER (WHERE "sa"."success") AS "success_shots"
                   FROM ("public"."shot_attempts" "sa"
                     JOIN "public"."shot_sessions" "ss" ON (("ss"."id" = "sa"."session_id")))
                  WHERE ("ss"."user_id" = "s"."user_id")
                  GROUP BY "sa"."shot_type") "sub") AS "shot_type_performance"
   FROM ("public"."shot_sessions" "s"
     JOIN "public"."shot_attempts" "a" ON (("a"."session_id" = "s"."id")))
  GROUP BY "s"."user_id";


ALTER VIEW "public"."total_sessions_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "comment" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "auth_id" "uuid" NOT NULL,
    "name" "text",
    "location" "text",
    "handicap" smallint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "city" character varying(100),
    "state" character varying(100),
    "country" character varying(100) DEFAULT 'US'::character varying
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."drills"
    ADD CONSTRAINT "drills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_plan_drills"
    ADD CONSTRAINT "practice_plan_drills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_plans"
    ADD CONSTRAINT "practice_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("auth_id");



ALTER TABLE ONLY "public"."shot_attempts"
    ADD CONSTRAINT "shot_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shot_sessions"
    ADD CONSTRAINT "shot_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_plan_drills"
    ADD CONSTRAINT "practice_plan_drills_drill_id_fkey" FOREIGN KEY ("drill_id") REFERENCES "public"."drills"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_plan_drills"
    ADD CONSTRAINT "practice_plan_drills_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."practice_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_plans"
    ADD CONSTRAINT "practice_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("auth_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."shot_attempts"
    ADD CONSTRAINT "shot_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."shot_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shot_sessions"
    ADD CONSTRAINT "shot_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feedback"
    ADD CONSTRAINT "user_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."drills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."practice_plan_drills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."practice_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shot_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shot_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


















GRANT ALL ON TABLE "public"."drills" TO "anon";
GRANT ALL ON TABLE "public"."drills" TO "authenticated";
GRANT ALL ON TABLE "public"."drills" TO "service_role";



GRANT ALL ON TABLE "public"."practice_plan_drills" TO "anon";
GRANT ALL ON TABLE "public"."practice_plan_drills" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_plan_drills" TO "service_role";



GRANT ALL ON TABLE "public"."practice_plans" TO "anon";
GRANT ALL ON TABLE "public"."practice_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_plans" TO "service_role";



GRANT ALL ON TABLE "public"."shot_attempts" TO "anon";
GRANT ALL ON TABLE "public"."shot_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."shot_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."shot_sessions" TO "anon";
GRANT ALL ON TABLE "public"."shot_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."shot_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."total_sessions_summary" TO "anon";
GRANT ALL ON TABLE "public"."total_sessions_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."total_sessions_summary" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









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































RESET ALL;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


