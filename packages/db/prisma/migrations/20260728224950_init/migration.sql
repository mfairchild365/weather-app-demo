-- CreateEnum
CREATE TYPE "ingest_run_status" AS ENUM ('running', 'success', 'failed');

-- CreateTable
CREATE TABLE "regions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "region_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "latitude" DECIMAL(8,5) NOT NULL,
    "longitude" DECIMAL(8,5) NOT NULL,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "attribution_url" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_types" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,

    CONSTRAINT "measurement_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" SERIAL NOT NULL,
    "measurement_type_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_units" (
    "provider_id" INTEGER NOT NULL,
    "measurement_type_id" INTEGER NOT NULL,
    "unit_id" INTEGER NOT NULL,

    CONSTRAINT "provider_units_provider_id_measurement_type_id_pk" PRIMARY KEY ("provider_id","measurement_type_id")
);

-- CreateTable
CREATE TABLE "weather_codes" (
    "code" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "icon_key" TEXT NOT NULL,

    CONSTRAINT "weather_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ingest_runs" (
    "id" SERIAL NOT NULL,
    "provider_id" INTEGER NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "status" "ingest_run_status" NOT NULL DEFAULT 'running',
    "error" TEXT,

    CONSTRAINT "ingest_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" SERIAL NOT NULL,
    "city_id" INTEGER NOT NULL,
    "ingest_run_id" INTEGER NOT NULL,
    "observed_at" TIMESTAMPTZ(6) NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "wind_speed" DECIMAL(5,2) NOT NULL,
    "wind_direction" DECIMAL(5,1),
    "humidity" DECIMAL(5,2),
    "pressure" DECIMAL(6,2),
    "precipitation" DECIMAL(6,2),
    "weather_code" INTEGER NOT NULL,
    "is_day" BOOLEAN NOT NULL,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_daily" (
    "id" SERIAL NOT NULL,
    "city_id" INTEGER NOT NULL,
    "ingest_run_id" INTEGER NOT NULL,
    "valid_date" DATE NOT NULL,
    "temperature_min" DECIMAL(5,2) NOT NULL,
    "temperature_max" DECIMAL(5,2) NOT NULL,
    "wind_speed_max" DECIMAL(5,2),
    "precipitation_sum" DECIMAL(6,2),
    "precipitation_probability_max" DECIMAL(5,2),
    "weather_code" INTEGER NOT NULL,
    "sunrise" TIMESTAMPTZ(6),
    "sunset" TIMESTAMPTZ(6),

    CONSTRAINT "forecast_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forecast_hourly" (
    "id" SERIAL NOT NULL,
    "city_id" INTEGER NOT NULL,
    "ingest_run_id" INTEGER NOT NULL,
    "valid_at" TIMESTAMPTZ(6) NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "wind_speed" DECIMAL(5,2),
    "wind_direction" DECIMAL(5,1),
    "humidity" DECIMAL(5,2),
    "precipitation" DECIMAL(6,2),
    "precipitation_probability" DECIMAL(5,2),
    "weather_code" INTEGER NOT NULL,
    "is_day" BOOLEAN NOT NULL,

    CONSTRAINT "forecast_hourly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_code_unique" ON "regions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_unique" ON "cities"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "providers_key_unique" ON "providers"("key");

-- CreateIndex
CREATE UNIQUE INDEX "measurement_types_key_unique" ON "measurement_types"("key");

-- CreateIndex
CREATE UNIQUE INDEX "units_key_unique" ON "units"("key");

-- CreateIndex
CREATE UNIQUE INDEX "observations_city_observed_at_idx" ON "observations"("city_id", "observed_at");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_daily_city_valid_date_idx" ON "forecast_daily"("city_id", "valid_date");

-- CreateIndex
CREATE UNIQUE INDEX "forecast_hourly_city_valid_at_idx" ON "forecast_hourly"("city_id", "valid_at");

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_measurement_type_id_measurement_types_id_fk" FOREIGN KEY ("measurement_type_id") REFERENCES "measurement_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provider_units" ADD CONSTRAINT "provider_units_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provider_units" ADD CONSTRAINT "provider_units_measurement_type_id_measurement_types_id_fk" FOREIGN KEY ("measurement_type_id") REFERENCES "measurement_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "provider_units" ADD CONSTRAINT "provider_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ingest_runs" ADD CONSTRAINT "ingest_runs_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_ingest_run_id_ingest_runs_id_fk" FOREIGN KEY ("ingest_run_id") REFERENCES "ingest_runs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_weather_code_weather_codes_code_fk" FOREIGN KEY ("weather_code") REFERENCES "weather_codes"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forecast_daily" ADD CONSTRAINT "forecast_daily_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forecast_daily" ADD CONSTRAINT "forecast_daily_ingest_run_id_ingest_runs_id_fk" FOREIGN KEY ("ingest_run_id") REFERENCES "ingest_runs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forecast_daily" ADD CONSTRAINT "forecast_daily_weather_code_weather_codes_code_fk" FOREIGN KEY ("weather_code") REFERENCES "weather_codes"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forecast_hourly" ADD CONSTRAINT "forecast_hourly_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forecast_hourly" ADD CONSTRAINT "forecast_hourly_ingest_run_id_ingest_runs_id_fk" FOREIGN KEY ("ingest_run_id") REFERENCES "ingest_runs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "forecast_hourly" ADD CONSTRAINT "forecast_hourly_weather_code_weather_codes_code_fk" FOREIGN KEY ("weather_code") REFERENCES "weather_codes"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;
