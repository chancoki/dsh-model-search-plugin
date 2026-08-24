/**
 * DSH Model Search Plugin — server-side entry
 *
 * The node half is a stub for host-profile compatibility:
 * a DSH profile bundle that declares `dsh.bundle.patch` needs an apply.
 * The actual search logic lives in the client half (`src/client.ts`).
 */

import type { ModelSearchPluginOptions } from './types.js';

/**
 * Host-side apply (stub).
 * The client half (`./client.js`) drives the browser-side behaviour.
 */
export function apply(ctx: any, _config?: ModelSearchPluginOptions): void {
  // Host-side: no runtime behaviour needed; the browser half owns the search UI.
}

export type { ModelSearchPluginOptions } from './types.js';