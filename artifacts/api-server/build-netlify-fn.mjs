/**
 * build-netlify-fn.mjs
 *
 * Bundles artifacts/api-server/src/app.ts (the Express app, without app.listen)
 * into ../../netlify/functions/dist/api-bundle.mjs so it can be imported by
 * the Netlify serverless function wrapper.
 *
 * Run via: pnpm --filter @workspace/api-server run build:netlify-fn
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../netlify/functions/dist");

await rm(outDir, { recursive: true, force: true });

await esbuild({
  entryPoints: [path.resolve(__dirname, "src/app.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outdir: outDir,
  outExtension: { ".js": ".mjs" },
  entryNames: "api-bundle",
  logLevel: "info",
  external: [
    "*.node",
    "sharp",
    "better-sqlite3",
    "sqlite3",
    "canvas",
    "bcrypt",
    "argon2",
    "fsevents",
    "pg-native",
    "oracledb",
    "mongodb-client-encryption",
    "@aws-sdk/*",
    "@azure/*",
    "@google-cloud/*",
    "googleapis",
    "firebase-admin",
    "@prisma/client",
    "grpc",
    "mysql2",
    "sequelize",
    "typeorm",
    "knex",
    "electron",
  ],
  sourcemap: "linked",
  plugins: [
    esbuildPluginPino({ transports: ["pino-pretty"] }),
  ],
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
  },
});

console.log("Netlify function bundle written to netlify/functions/dist/api-bundle.mjs");
