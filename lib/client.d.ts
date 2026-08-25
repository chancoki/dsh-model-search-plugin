/**
 * DSH Model Search Plugin — client half
 *
 * A DOM-based DSH client plugin that adds a keyword search/filter input
 * to the model-selection popup menu.  It uses a MutationObserver to
 * detect when the menu opens and injects the search widget dynamically.
 *
 * The plugin is packaged as a DSH client plugin (`dsh.client` in
 * package.json) and loaded through window.__ModuleLoader__.
 */
import type { ModelSearchPluginOptions } from './types.js';
/**
 * Configure the plugin before activation.
 */
declare function configure(opts?: ModelSearchPluginOptions): void;
/**
 * Activate the plugin: inject CSS, start the document observer.
 */
declare function activate(): void;
/**
 * Deactivate the plugin: clean up all observers & injected DOM.
 */
declare function deactivate(): void;
/**
 * DSH client plugin entry — called by the Cordis Loader.
 *
 * @param ctx  Cordis context (unused by this DOM-based plugin).
 * @param opts Optional configuration.
 */
declare function apply(ctx: unknown, opts?: ModelSearchPluginOptions): void;
/**
 * Explicit export list — this is what `build-plugin.js` converts into
 * `exports.xxx = xxx` assignments when wrapping the compiled ESM for the
 * `window.__ModuleLoader__.load({ factory })` format. Without a grouped
 * `export { ... }` statement, the built `lib/client.js` would export nothing
 * and the browser-side Cordis Loader would reject it with
 * `invalid plugin, expect function or object with an "apply" method`.
 */
export { configure, activate, deactivate, apply };
//# sourceMappingURL=client.d.ts.map