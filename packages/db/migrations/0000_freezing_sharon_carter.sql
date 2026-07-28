CREATE TYPE "public"."ingest_run_status" AS ENUM('running', 'success', 'failed');--> statement-breakpoint
CREATE TABLE "regions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"region_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"latitude" numeric(8, 5) NOT NULL,
	"longitude" numeric(8, 5) NOT NULL,
	"timezone" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"attribution_url" text NOT NULL,
	"license" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "measurement_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "measurement_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "provider_units" (
	"provider_id" integer NOT NULL,
	"measurement_type_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	CONSTRAINT "provider_units_provider_id_measurement_type_id_pk" PRIMARY KEY("provider_id","measurement_type_id")
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"measurement_type_id" integer NOT NULL,
	"key" text NOT NULL,
	"symbol" text NOT NULL,
	"display_name" text NOT NULL,
	CONSTRAINT "units_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "weather_codes" (
	"code" integer PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"icon_key" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" "ingest_run_status" DEFAULT 'running' NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "observations" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"ingest_run_id" integer NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"temperature" numeric(5, 2) NOT NULL,
	"wind_speed" numeric(5, 2) NOT NULL,
	"wind_direction" numeric(5, 1),
	"humidity" numeric(5, 2),
	"pressure" numeric(6, 2),
	"precipitation" numeric(6, 2),
	"weather_code" integer NOT NULL,
	"is_day" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forecast_daily" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"ingest_run_id" integer NOT NULL,
	"valid_date" date NOT NULL,
	"temperature_min" numeric(5, 2) NOT NULL,
	"temperature_max" numeric(5, 2) NOT NULL,
	"wind_speed_max" numeric(5, 2),
	"precipitation_sum" numeric(6, 2),
	"precipitation_probability_max" numeric(5, 2),
	"weather_code" integer NOT NULL,
	"sunrise" timestamp with time zone,
	"sunset" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "forecast_hourly" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"ingest_run_id" integer NOT NULL,
	"valid_at" timestamp with time zone NOT NULL,
	"temperature" numeric(5, 2) NOT NULL,
	"wind_speed" numeric(5, 2),
	"wind_direction" numeric(5, 1),
	"humidity" numeric(5, 2),
	"precipitation" numeric(6, 2),
	"precipitation_probability" numeric(5, 2),
	"weather_code" integer NOT NULL,
	"is_day" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_units" ADD CONSTRAINT "provider_units_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_units" ADD CONSTRAINT "provider_units_measurement_type_id_measurement_types_id_fk" FOREIGN KEY ("measurement_type_id") REFERENCES "public"."measurement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_units" ADD CONSTRAINT "provider_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_measurement_type_id_measurement_types_id_fk" FOREIGN KEY ("measurement_type_id") REFERENCES "public"."measurement_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingest_runs" ADD CONSTRAINT "ingest_runs_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_ingest_run_id_ingest_runs_id_fk" FOREIGN KEY ("ingest_run_id") REFERENCES "public"."ingest_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observations" ADD CONSTRAINT "observations_weather_code_weather_codes_code_fk" FOREIGN KEY ("weather_code") REFERENCES "public"."weather_codes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_daily" ADD CONSTRAINT "forecast_daily_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_daily" ADD CONSTRAINT "forecast_daily_ingest_run_id_ingest_runs_id_fk" FOREIGN KEY ("ingest_run_id") REFERENCES "public"."ingest_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_daily" ADD CONSTRAINT "forecast_daily_weather_code_weather_codes_code_fk" FOREIGN KEY ("weather_code") REFERENCES "public"."weather_codes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_hourly" ADD CONSTRAINT "forecast_hourly_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_hourly" ADD CONSTRAINT "forecast_hourly_ingest_run_id_ingest_runs_id_fk" FOREIGN KEY ("ingest_run_id") REFERENCES "public"."ingest_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forecast_hourly" ADD CONSTRAINT "forecast_hourly_weather_code_weather_codes_code_fk" FOREIGN KEY ("weather_code") REFERENCES "public"."weather_codes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "observations_city_observed_at_idx" ON "observations" USING btree ("city_id","observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "forecast_daily_city_valid_date_idx" ON "forecast_daily" USING btree ("city_id","valid_date");--> statement-breakpoint
CREATE UNIQUE INDEX "forecast_hourly_city_valid_at_idx" ON "forecast_hourly" USING btree ("city_id","valid_at");