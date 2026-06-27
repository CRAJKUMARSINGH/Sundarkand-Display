/**
 * Netlify Function: api
 *
 * Handles all /api/* requests (proxied via netlify.toml [[redirects]]).
 *
 * The Express app is pre-bundled by `pnpm --filter @workspace/api-server run build:netlify-fn`
 * into netlify/functions/dist/api-bundle.mjs.  serverless-http is included
 * in that bundle so no separate install is needed here.
 */
import serverless from "serverless-http";
import app from "./dist/api-bundle.mjs";

export const handler = serverless(app);
