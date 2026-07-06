/**
 * Netlify Function: api
 *
 * Handles all /api/* requests (proxied via netlify.toml [[redirects]]).
 *
 * The Express app and serverless-http wrapper are pre-bundled by
 * `pnpm --filter @workspace/api-server run build:netlify-fn` into
 * netlify/functions/dist/api-bundle.mjs.
 */
export { handler } from "./dist/api-bundle.mjs";
