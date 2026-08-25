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
export declare function apply(ctx: any, _config?: ModelSearchPluginOptions): void;
export type { ModelSearchPluginOptions } from './types.js';
//# sourceMappingURL=index.d.ts.map