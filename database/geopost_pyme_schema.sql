-- ==========================================================
-- NutriAnalytics - Script de Migración GeoSoft a Supabase / PostgreSQL
-- Generado automáticamente: 2026-10-20 17:58:57
-- ==========================================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
CREATE SCHEMA IF NOT EXISTS geosoft;
SET search_path TO geosoft, public;

-- Funciones de compatibilidad T-SQL en PostgreSQL
CREATE OR REPLACE FUNCTION month(d timestamp) RETURNS integer AS $$ SELECT EXTRACT(MONTH FROM d)::integer; $$ LANGUAGE sql IMMUTABLE;
CREATE OR REPLACE FUNCTION month(d date) RETURNS integer AS $$ SELECT EXTRACT(MONTH FROM d)::integer; $$ LANGUAGE sql IMMUTABLE;
CREATE OR REPLACE FUNCTION year(d timestamp) RETURNS integer AS $$ SELECT EXTRACT(YEAR FROM d)::integer; $$ LANGUAGE sql IMMUTABLE;
CREATE OR REPLACE FUNCTION year(d date) RETURNS integer AS $$ SELECT EXTRACT(YEAR FROM d)::integer; $$ LANGUAGE sql IMMUTABLE;
CREATE OR REPLACE FUNCTION datediff(units text, d1 date, d2 date) RETURNS integer AS $$ SELECT (d2 - d1)::integer; $$ LANGUAGE sql IMMUTABLE;
CREATE OR REPLACE FUNCTION datediff(units text, d1 timestamp, d2 timestamp) RETURNS integer AS $$ SELECT (DATE(d2) - DATE(d1))::integer; $$ LANGUAGE sql IMMUTABLE;
CREATE OR REPLACE FUNCTION round(val double precision, places integer) RETURNS double precision AS $$ SELECT round(val::numeric, places)::double precision; $$ LANGUAGE sql IMMUTABLE;
CREATE OR REPLACE FUNCTION isnull(val anyelement, fallback anyelement) RETURNS anyelement AS $$ SELECT COALESCE(val, fallback); $$ LANGUAGE sql IMMUTABLE;

-- ----------------------------------------------------------
-- Tabla: sucursales
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "sucursales" CASCADE;
CREATE TABLE "sucursales" (
    "codemp" VARCHAR(3),
    "codsuc" VARCHAR(3),
    "nomsuc" VARCHAR(20),
    "estado" VARCHAR(1),
    "telsuc" TEXT,
    "ctagasvta" VARCHAR(25),
    "ctavtatc" VARCHAR(25),
    "dirsuc" VARCHAR(120),
    "zonaventa" VARCHAR(120),
    "rubro" VARCHAR(120),
    "lan_path" VARCHAR(200),
    "lan_ip" VARCHAR(20),
    "sqlserver" VARCHAR(40),
    "cta_caja" VARCHAR(25),
    "cta_iva_fc" VARCHAR(25),
    "cta_iva_cf" VARCHAR(25),
    "cta_vta_con_fc" VARCHAR(25),
    "cta_vta_con_cf" VARCHAR(25),
    "cta_vta_con_ex" VARCHAR(25),
    "cta_vta_crd_fc" VARCHAR(25),
    "cta_vta_crd_cf" VARCHAR(25),
    "cta_vta_crd_ex" VARCHAR(25),
    "cta_ant_cliente" VARCHAR(25),
    "cta_com_prepago" VARCHAR(25),
    "cta_vc_cargo" VARCHAR(25),
    "cta_vc_abono" VARCHAR(25),
    "bodegas" VARCHAR(30),
    "vpn_cat" TEXT,
    "vpn_precios" TEXT,
    "vpn_bitacora" TEXT,
    "vpn_ventas" TEXT,
    "vpn_kardex" TEXT,
    "vpn_costos" TEXT,
    "vpn_partidas" TEXT,
    "vpn_fctcompras" TEXT,
    "cta_compras" VARCHAR(25),
    "cta_vta_devolucion" VARCHAR(25),
    "cta_com_devolucion" VARCHAR(25),
    "cta_iva_fc_crd" VARCHAR(25),
    "cta_iva_cf_crd" VARCHAR(25),
    "pcomision" NUMERIC,
    "ncomision" NUMERIC,
    "cta_ivaper_crd" VARCHAR(25),
    "cta_ivaper_con" VARCHAR(25),
    "cta_tar_comision" VARCHAR(25),
    "cta_tar_per" VARCHAR(25),
    "cta_tar_iva" VARCHAR(25),
    "cta_vta_devolucion2" VARCHAR(25)
);


-- ----------------------------------------------------------
-- Tabla: vendedores
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "vendedores" CASCADE;
CREATE TABLE "vendedores" (
    "codemp" VARCHAR(3),
    "codven" VARCHAR(10),
    "nomven" VARCHAR(40),
    "clave" VARCHAR(6),
    "estado" VARCHAR(1),
    "por_venta" NUMERIC,
    "por_cobros" NUMERIC,
    "por_abonos" NUMERIC,
    "monto" NUMERIC,
    "por_ventacrd" NUMERIC,
    "monto_crd" NUMERIC,
    "imagen" TEXT,
    "codempl" VARCHAR(6),
    "metavensuc" TEXT,
    "metavenemp" TEXT
);


-- ----------------------------------------------------------
-- Tabla: rubros
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "rubros" CASCADE;
CREATE TABLE "rubros" (
    "codemp" VARCHAR(3),
    "codrub" VARCHAR(12),
    "nomrub" VARCHAR(80),
    "estado" VARCHAR(1),
    "codctaa" VARCHAR(25),
    "codctac" VARCHAR(25),
    "codctavta" VARCHAR(25),
    "codctavta_exp" VARCHAR(25),
    "id_imp" TEXT
);


-- ----------------------------------------------------------
-- Tabla: clientes
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "clientes" CASCADE;
CREATE TABLE "clientes" (
    "codemp" VARCHAR(3),
    "codcli" VARCHAR(8),
    "nomcli" VARCHAR(120),
    "nominfct" VARCHAR(120),
    "contacto" VARCHAR(130),
    "enccompras" VARCHAR(130),
    "dircli" VARCHAR(250),
    "telefono1" TEXT,
    "telefono2" TEXT,
    "faxcli" VARCHAR(20),
    "email" VARCHAR(160),
    "dui" VARCHAR(30),
    "nit" VARCHAR(30),
    "nrc" VARCHAR(30),
    "giro" VARCHAR(140),
    "codcatcli" VARCHAR(2),
    "moncrd" NUMERIC,
    "diascrd" TEXT,
    "maxdscto" NUMERIC,
    "exentoiva" TEXT,
    "estado" VARCHAR(1),
    "codsuc" VARCHAR(3),
    "feccredito" TEXT,
    "firma" TEXT,
    "nota" VARCHAR(200),
    "fecgrb" TEXT,
    "usergrb" VARCHAR(40),
    "clase" VARCHAR(1),
    "mayorista" TEXT,
    "codzon" VARCHAR(3),
    "id_precio" TEXT,
    "codctacon" VARCHAR(50),
    "codven" VARCHAR(10),
    "codigo_dep" VARCHAR(3),
    "codigo_mu" VARCHAR(3),
    "codbod" VARCHAR(3),
    "odoccli" VARCHAR(150),
    "omitir_precio_minimo" TEXT,
    "pasaporte" VARCHAR(30),
    "vipnum" VARCHAR(10),
    "pais" VARCHAR(10),
    "otrodoc" VARCHAR(50),
    "codactividad" VARCHAR(10)
);


-- ----------------------------------------------------------
-- Tabla: productos
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "productos" CASCADE;
CREATE TABLE "productos" (
    "codemp" VARCHAR(3),
    "codprd" VARCHAR(30),
    "nomprd" VARCHAR(80),
    "codrub" VARCHAR(12),
    "codsub" VARCHAR(20),
    "codbar" VARCHAR(20),
    "descfct" VARCHAR(80),
    "codtipprd" VARCHAR(3),
    "codcolor" VARCHAR(2),
    "exento" TEXT,
    "precioa" NUMERIC,
    "preciob" NUMERIC,
    "precioc" NUMERIC,
    "preciod" NUMERIC,
    "precioe" NUMERIC,
    "costouni" NUMERIC,
    "costoant" NUMERIC,
    "exiini" NUMERIC,
    "exifin" NUMERIC,
    "maxdscto" NUMERIC,
    "unibas" VARCHAR(20),
    "estado" VARCHAR(1),
    "horagrb" TEXT,
    "usuario" VARCHAR(40),
    "ok" TEXT,
    "foto" VARCHAR(150),
    "oferta" TEXT,
    "servicio" TEXT,
    "neto" TEXT,
    "pcgrb" VARCHAR(20),
    "codprdg" VARCHAR(30),
    "imagen" TEXT,
    "marca" VARCHAR(30),
    "ficha" TEXT,
    "pcomision" NUMERIC,
    "peso" NUMERIC,
    "correlativo" NUMERIC,
    "decimales" TEXT,
    "paf_codprd" VARCHAR(30),
    "tax_fovial" TEXT,
    "tax_turismo" TEXT,
    "precioref" NUMERIC,
    "codbod" VARCHAR(3),
    "millares" NUMERIC,
    "pedirclave" TEXT,
    "largo" VARCHAR(10),
    "talla" VARCHAR(10),
    "id_imp" TEXT,
    "referencia" VARCHAR(30)
);


-- ----------------------------------------------------------
-- Tabla: existencias
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "existencias" CASCADE;
CREATE TABLE "existencias" (
    "codemp" VARCHAR(3),
    "codprd" VARCHAR(30),
    "codbod" VARCHAR(3),
    "exiprd" NUMERIC
);


-- ----------------------------------------------------------
-- Tabla: encfct
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "encfct" CASCADE;
CREATE TABLE "encfct" (
    "codemp" VARCHAR(3),
    "id_fac" VARCHAR(36),
    "codsuc" VARCHAR(3),
    "tipfct" VARCHAR(2),
    "numfct" VARCHAR(10),
    "codcli" VARCHAR(8),
    "codbod" VARCHAR(3),
    "fecfct" TEXT,
    "fecven" TEXT,
    "shipto" VARCHAR(120),
    "dirship" VARCHAR(250),
    "condpgo" VARCHAR(3),
    "nrc" VARCHAR(30),
    "nit" VARCHAR(30),
    "codven" VARCHAR(10),
    "valexp" NUMERIC,
    "valexe" NUMERIC,
    "valgrv" NUMERIC,
    "iva" NUMERIC,
    "ivaper" NUMERIC,
    "fovial" NUMERIC,
    "observ" VARCHAR(100),
    "estado" VARCHAR(1),
    "fecgrb" TEXT,
    "usergrb" VARCHAR(40),
    "pcgrb" VARCHAR(20),
    "dui" VARCHAR(30),
    "id_fac_cr" VARCHAR(36),
    "id_fac_vc" VARCHAR(36),
    "bycobros" TEXT,
    "ntaco" TEXT,
    "id_corr" TEXT,
    "fecenv" TEXT,
    "depto" VARCHAR(30),
    "munic" VARCHAR(30),
    "pais" VARCHAR(30),
    "empaque" VARCHAR(20),
    "transporte" VARCHAR(20),
    "ordcompra" VARCHAR(20),
    "numped" VARCHAR(10),
    "iforma_pago" VARCHAR(50),
    "imonto_recibido" NUMERIC,
    "icambio" NUMERIC,
    "pdesc" NUMERIC,
    "compret" VARCHAR(10),
    "telship" TEXT,
    "vta3s" TEXT,
    "userped" VARCHAR(40),
    "fecped" TEXT,
    "enviar" TEXT,
    "valotr" NUMERIC,
    "inumbultos" VARCHAR(50),
    "ipeso" VARCHAR(50),
    "ipreparadopor" VARCHAR(150),
    "iautorizadopor" VARCHAR(150),
    "incoterm" VARCHAR(50),
    "pasaporte" VARCHAR(30),
    "numvuelo" VARCHAR(30),
    "tipvtae" VARCHAR(1),
    "ex_recinto" VARCHAR(2),
    "mh_tipo" VARCHAR(2),
    "mh_clase" VARCHAR(2)
);


-- ----------------------------------------------------------
-- Tabla: detfct
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "detfct" CASCADE;
CREATE TABLE "detfct" (
    "codemp" VARCHAR(3),
    "id_fac" VARCHAR(36),
    "tipfct" VARCHAR(2),
    "numfct" VARCHAR(10),
    "fecfct" TEXT,
    "codbod" VARCHAR(3),
    "codprd" VARCHAR(30),
    "tipvta" VARCHAR(1),
    "qtyvta" NUMERIC,
    "prcact" NUMERIC,
    "fecgrb" TEXT,
    "usergrb" VARCHAR(40),
    "codsuc" VARCHAR(3),
    "linea" TEXT,
    "unidad" VARCHAR(50),
    "pdesc" NUMERIC,
    "nserie" VARCHAR(60),
    "id" TEXT,
    "efecinv" TEXT,
    "efecvta" TEXT,
    "id_precio" TEXT,
    "qtyprepago" NUMERIC,
    "prcorden" NUMERIC,
    "compuesto" TEXT,
    "facinv" NUMERIC,
    "facprc" NUMERIC,
    "codprdcm" VARCHAR(30),
    "id_cm" TEXT,
    "qtyent" NUMERIC,
    "fecent" TEXT,
    "norden" TEXT,
    "id_oferta" TEXT,
    "oprcact" NUMERIC,
    "pregalo" TEXT
);


-- ----------------------------------------------------------
-- Tabla: movcxc
-- ----------------------------------------------------------
DROP TABLE IF EXISTS "movcxc" CASCADE;
CREATE TABLE "movcxc" (
    "codemp" VARCHAR(3),
    "id_fac" VARCHAR(36),
    "codcli" VARCHAR(8),
    "tipfct" VARCHAR(2),
    "numfct" VARCHAR(10),
    "fecmov" TEXT,
    "tipmov" VARCHAR(2),
    "numdoc" VARCHAR(6),
    "valmov" NUMERIC,
    "iva" NUMERIC,
    "ivaper" NUMERIC,
    "fecgrb" TEXT,
    "usergrb" VARCHAR(40),
    "codsuc" VARCHAR(3),
    "intcob" NUMERIC,
    "intdeb" NUMERIC,
    "concepto" VARCHAR(30),
    "cheque" VARCHAR(15),
    "banco" VARCHAR(20),
    "posfec" TEXT,
    "bycobros" TEXT,
    "id" VARCHAR(36),
    "condpgo" VARCHAR(30),
    "origen" VARCHAR(30),
    "id_movcxc" VARCHAR(36),
    "audifec" TEXT,
    "audiuser" VARCHAR(40),
    "audipc" VARCHAR(40),
    "valmovcon" NUMERIC,
    "nocomision" TEXT
);


-- ==========================================================
-- Índices de Alto Rendimiento para Analíticas y Reportería
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_encfct_fecfct ON "encfct" ("fecfct");
CREATE INDEX IF NOT EXISTS idx_encfct_codsuc ON "encfct" ("codsuc");
CREATE INDEX IF NOT EXISTS idx_encfct_codven ON "encfct" ("codven");
CREATE INDEX IF NOT EXISTS idx_encfct_codcli ON "encfct" ("codcli");
CREATE INDEX IF NOT EXISTS idx_encfct_id_fac ON "encfct" ("id_fac");
CREATE INDEX IF NOT EXISTS idx_detfct_id_fac ON "detfct" ("id_fac");
CREATE INDEX IF NOT EXISTS idx_detfct_codprd ON "detfct" ("codprd");
CREATE INDEX IF NOT EXISTS idx_existencias_codprd ON "existencias" ("codprd");
CREATE INDEX IF NOT EXISTS idx_existencias_codbod ON "existencias" ("codbod");
CREATE INDEX IF NOT EXISTS idx_movcxc_id_fac ON "movcxc" ("id_fac");
CREATE INDEX IF NOT EXISTS idx_movcxc_codcli ON "movcxc" ("codcli");
CREATE INDEX IF NOT EXISTS idx_productos_codprd ON "productos" ("codprd");
CREATE INDEX IF NOT EXISTS idx_clientes_codcli ON "clientes" ("codcli");

