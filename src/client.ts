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
import { DEFAULT_OPTIONS, DSH_CSS_VARS } from './types.js';

// ──── Types ────────────────────────────────────────────────────────────────

interface PluginState {
  menuEl: HTMLElement | null;
  groupsEl: HTMLElement | null;
  searchEl: HTMLInputElement | null;
  clearEl: HTMLElement | null;
  noResultsEl: HTMLElement | null;
  observer: MutationObserver | null;
  documentObserver: MutationObserver | null;
  isActive: boolean;
  menuCleanup: (() => void) | null;
}

/**
 * State for the "fetch available models" picker dialog
 * (设置 → 模型 → 添加提供方 → 自定义设置 → 获取可用模型).
 */
interface PickerState {
  dialogEl: HTMLElement | null;
  listEl: HTMLElement | null;
  searchEl: HTMLInputElement | null;
  clearEl: HTMLElement | null;
  noResultsEl: HTMLElement | null;
  observer: MutationObserver | null;
}

// ──── Defaults ─────────────────────────────────────────────────────────────

const DEFAULTS: Required<ModelSearchPluginOptions> = {
  ...DEFAULT_OPTIONS,
};

// ──── State ────────────────────────────────────────────────────────────────

const state: PluginState = {
  menuEl: null,
  groupsEl: null,
  searchEl: null,
  clearEl: null,
  noResultsEl: null,
  observer: null,
  documentObserver: null,
  isActive: false,
  menuCleanup: null,
};

const pickerState: PickerState = {
  dialogEl: null,
  listEl: null,
  searchEl: null,
  clearEl: null,
  noResultsEl: null,
  observer: null,
};

let config: Required<ModelSearchPluginOptions> = { ...DEFAULTS };
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pickerDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Placeholder shown in the fetch-models candidate picker. */
const PICKER_PLACEHOLDER = '搜索可用模型…';

// ──── CSS injection ────────────────────────────────────────────────────────

const CSS_ID = 'dsh-model-search-plugin-style';
const CSS_CONTENT = `
.${DEFAULTS.containerClass} {
  flex: none;
  padding: 4px 6px 0;
}
.${DEFAULTS.containerClass} .search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.${DEFAULTS.inputClass} {
  width: 100%;
  height: 28px;
  padding: 0 24px 0 8px;
  border: 1px solid ${DSH_CSS_VARS.borderInverted};
  border-radius: 6px;
  background: transparent;
  color: ${DSH_CSS_VARS.labelPrimary};
  font-size: 13px;
  line-height: 20px;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.${DEFAULTS.inputClass}::placeholder {
  color: ${DSH_CSS_VARS.labelCaption};
}
.${DEFAULTS.inputClass}:focus {
  border-color: #4f8cff;
  box-shadow: 0 0 0 2px rgba(79,140,255,.25);
}
.${DEFAULTS.inputClass}.has-value + .search-clear-btn {
  display: flex;
}
.search-clear-btn {
  display: none;
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: ${DSH_CSS_VARS.labelCaption};
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  transition: color .15s;
}
.search-clear-btn:hover {
  color: ${DSH_CSS_VARS.labelPrimary};
}
.search-no-results {
  padding: 6px 8px;
  color: ${DSH_CSS_VARS.labelTertiary};
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}
.${DEFAULTS.inputClass}.no-results {
  border-color: ${DSH_CSS_VARS.stateErrorPrimary};
}
`;

function injectStyles() {
  if (document.getElementById(CSS_ID)) return;
  const style = document.createElement('style');
  style.id = CSS_ID;
  style.textContent = CSS_CONTENT;
  document.head.appendChild(style);
}

function removeStyles() {
  const el = document.getElementById(CSS_ID);
  el?.remove();
}

// ──── Search UI construction ────────────────────────────────────────────

function buildSearchUI(placeholder?: string): HTMLInputElement {
  const container = document.createElement('div');
  container.className = config.containerClass;

  const wrapper = document.createElement('div');
  wrapper.className = 'search-wrapper';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = config.inputClass;
  input.placeholder = placeholder ?? config.placeholder;
  input.spellcheck = false;
  input.autocomplete = 'off';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'search-clear-btn';
  clearBtn.type = 'button';
  clearBtn.textContent = '✕';
  clearBtn.setAttribute('aria-label', 'Clear search');

  wrapper.appendChild(input);
  wrapper.appendChild(clearBtn);
  container.appendChild(wrapper);

  if (placeholder === PICKER_PLACEHOLDER) {
    pickerState.searchEl = input;
    pickerState.clearEl = clearBtn;
  } else {
    state.searchEl = input;
    state.clearEl = clearBtn;
  }

  // ── events ──
  input.addEventListener('input', onSearchInput);
  input.addEventListener('keydown', onSearchKeydown);
  clearBtn.addEventListener('click', onClearClick);

  // global hotkey for focusing search
  document.addEventListener('keydown', onGlobalKeydown);

  return input;
}

// ──── Event handlers ─────────────────────────────────────────────────────

function onSearchInput(this: HTMLInputElement, ev?: Event) {
  const el = (ev?.target as HTMLInputElement) ?? this ?? state.searchEl ?? pickerState.searchEl;
  if (!el) return;

  const hasValue = el.value.length > 0;
  el.classList.toggle('has-value', hasValue);

  const isPicker = el === pickerState.searchEl;
  const timer = isPicker ? 'picker' : 'menu';
  if (timer === 'picker') {
    if (pickerDebounceTimer) clearTimeout(pickerDebounceTimer);
    pickerDebounceTimer = setTimeout(() => performPickerSearch(el.value), config.debounceDelay);
  } else {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => performSearch(el.value), config.debounceDelay);
  }
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    const el = e.target as HTMLInputElement;
    if (el && el.value) {
      el.value = '';
      el.classList.remove('has-value');
      if (el === pickerState.searchEl) performPickerSearch('');
      else performSearch('');
    } else {
      el?.blur();
    }
    e.preventDefault();
    return;
  }

  if (e.key === 'Enter') {
    const el = e.target as HTMLInputElement;
    if (el === pickerState.searchEl) performPickerSearch(el.value);
    else performSearch(el?.value ?? '');
    e.preventDefault();
  }

  // Arrow keys in search field: forward focus to first/last model option
  if (e.key === 'ArrowDown') {
    const firstOption =
      pickerState.listEl?.querySelector<HTMLElement>('li:not([style*="none"]) label') ??
      state.groupsEl?.querySelector<HTMLElement>('[role="menuitemradio"]');
    firstOption?.focus();
    e.preventDefault();
  }
}

function onClearClick(e: MouseEvent) {
  const el = (e.currentTarget as HTMLElement)?.previousElementSibling as HTMLInputElement | null;
  const input = el ?? state.searchEl ?? pickerState.searchEl;
  if (input) {
    input.value = '';
    input.classList.remove('has-value');
    if (input === pickerState.searchEl) performPickerSearch('');
    else performSearch('');
    input.focus();
  }
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (!config.focusHotkey) return;
  if (e.key !== config.focusHotkey) return;
  if (config.focusRequiresModifier && !(e.metaKey || e.ctrlKey)) return;
  if (!state.isActive) return;

  // Don't steal focus from other inputs
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  e.preventDefault();
  (pickerState.searchEl ?? state.searchEl)?.focus();
}

// ──── Candidate picker (fetch available models) search ──────────────────

/**
 * Filter the candidate model list of the fetch-models picker by keyword.
 * Each row is `li > label > input[checkbox] + span.candidateId`.
 */
function performPickerSearch(query: string) {
  const listEl = pickerState.listEl;
  if (!listEl) return;

  const q = query.trim().toLowerCase();
  const items = listEl.querySelectorAll<HTMLElement>('li');

  if (q.length < config.minQueryLength) {
    for (const li of items) li.style.display = '';
    showPickerNoResults(false);
    return;
  }

  let matches = 0;
  for (const li of items) {
    const text = li.textContent?.toLowerCase() ?? '';
    const hit = text.includes(q);
    li.style.display = hit || !config.hideUnmatched ? '' : 'none';
    if (hit) matches++;
  }
  showPickerNoResults(config.showNoResults && matches === 0 && q.length > 0);
}

function showPickerNoResults(show: boolean) {
  if (!pickerState.noResultsEl) {
    const el = document.createElement('div');
    el.className = 'search-no-results';
    el.textContent = '没有匹配的模型';
    pickerState.noResultsEl = el;
  }
  const listEl = pickerState.listEl;
  if (show) {
    if (listEl && !pickerState.noResultsEl.parentNode) {
      listEl.parentNode?.insertBefore(pickerState.noResultsEl, listEl);
    }
    pickerState.noResultsEl.style.display = '';
    pickerState.searchEl?.classList.add('no-results');
  } else {
    pickerState.noResultsEl.style.display = 'none';
    pickerState.searchEl?.classList.remove('no-results');
  }
}

/** The scrollable `ul` that lists the provider's available models. */
function findCandidateList(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>('ul[class*="candidateList"]');
}

function injectSearchIntoPicker(listEl: HTMLElement) {
  // Don't inject twice
  if (pickerState.searchEl && listEl.contains(pickerState.searchEl)) return;

  const input = buildSearchUI(PICKER_PLACEHOLDER);
  const container = input.closest(`.${config.containerClass}`) as HTMLElement;

  // Insert above the list; keep it visually inside the dialog body
  listEl.parentNode?.insertBefore(container!, listEl);

  setTimeout(() => input.focus(), 60);
}

function attachPickerObserver(dialogEl: HTMLElement) {
  if (pickerState.observer) pickerState.observer.disconnect();

  pickerState.observer = new MutationObserver(() => {
    const listEl = findCandidateList(dialogEl);
    if (listEl && listEl !== pickerState.listEl) {
      pickerState.listEl = listEl;
      injectSearchIntoPicker(listEl);
    }
    if (!document.body.contains(dialogEl)) detachFromPicker();
  });

  pickerState.observer.observe(dialogEl, { childList: true, subtree: true });
}

function detachFromPicker() {
  pickerState.listEl = null;

  if (pickerState.observer) {
    pickerState.observer.disconnect();
    pickerState.observer = null;
  }

  if (pickerState.searchEl) {
    pickerState.searchEl.removeEventListener('input', onSearchInput);
    pickerState.searchEl.removeEventListener('keydown', onSearchKeydown);
    pickerState.searchEl = null;
  }
  if (pickerState.clearEl) {
    pickerState.clearEl.removeEventListener('click', onClearClick);
    pickerState.clearEl = null;
  }
  if (pickerState.noResultsEl) {
    pickerState.noResultsEl.remove();
    pickerState.noResultsEl = null;
  }

  const container = document.querySelectorAll(`.${config.containerClass}`);
  container.forEach((el) => {
    // remove only containers that are NOT the menu's search box
    if (!el.contains(state.searchEl ?? null)) el.remove();
  });

  if (pickerDebounceTimer) {
    clearTimeout(pickerDebounceTimer);
    pickerDebounceTimer = null;
  }

  pickerState.dialogEl = null;
}

// ──── Search / filter logic ────────────────────────────────────────────

function performSearch(query: string) {
  const groupsEl = state.groupsEl;
  if (!groupsEl) return;

  const q = query.trim().toLowerCase();

  if (q.length < config.minQueryLength) {
    // Show all
    const allOptions = groupsEl.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    for (const opt of allOptions) {
      opt.style.display = '';
      opt.classList.remove('model-search-match');
    }
    const allSections = groupsEl.querySelectorAll<HTMLElement>('section[role="group"]');
    for (const sec of allSections) {
      sec.style.display = '';
    }
    showNoResults(false);
    return;
  }

  let totalMatches = 0;

  const sections = groupsEl.querySelectorAll<HTMLElement>('section[role="group"]');
  for (const section of sections) {
    const options = section.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    let sectionMatches = 0;

    for (const opt of options) {
      const text = opt.textContent?.toLowerCase() ?? '';
      const matches = text.includes(q);
      if (matches) {
        opt.style.display = '';
        opt.classList.add('model-search-match');
        sectionMatches++;
        totalMatches++;
      } else {
        opt.style.display = config.hideUnmatched ? 'none' : '';
        opt.classList.remove('model-search-match');
      }
    }

    // Hide section if it has no visible options (when hiding unmatched)
    if (config.hideUnmatched) {
      section.style.display = sectionMatches === 0 ? 'none' : '';
    } else {
      section.style.display = '';
    }
  }

  showNoResults(config.showNoResults && totalMatches === 0 && q.length > 0);
}

function showNoResults(show: boolean) {
  if (!state.noResultsEl) {
    const el = document.createElement('div');
    el.className = 'search-no-results';
    el.textContent = '没有匹配的模型';
    state.noResultsEl = el;
  }

  if (show) {
    if (state.groupsEl && !state.noResultsEl.parentNode) {
      state.groupsEl.parentNode?.insertBefore(state.noResultsEl, state.groupsEl);
    }
    state.noResultsEl.style.display = '';
    state.searchEl?.classList.add('no-results');
  } else {
    state.noResultsEl.style.display = 'none';
    state.searchEl?.classList.remove('no-results');
  }
}

// ──── Menu detection & injection ────────────────────────────────────────

/**
 * Check whether a DOM element is or contains the ModelSelect menu.
 * The model-selection menu has role="menu" and its aria-label mentions "model".
 */
function isModelMenu(el: Element): boolean {
  if (el.getAttribute('role') === 'menu') {
    const label = el.getAttribute('aria-label')?.toLowerCase() ?? '';
    if (label.includes('model') || label.includes('推理等级') || label.includes('effort')) {
      return true;
    }
  }
  // Check children
  return el.querySelector('[role="menu"][aria-label*="model" i],[role="menu"][aria-label*="推理等级"],[role="menu"][aria-label*="effort" i]') !== null;
}

/**
 * Find the groups container inside a model menu.
 * Returns the scrollable div that wraps [role="group"] sections.
 */
function findGroupsContainer(menuEl: HTMLElement): HTMLElement | null {
  // Look for a div that contains [role="group"] sections
  const groupsWrapper = menuEl.querySelector<HTMLElement>('div:not([role])');
  if (groupsWrapper && groupsWrapper.querySelector('[role="group"]')) {
    return groupsWrapper;
  }

  // Fallback: find the first child that contains sections with role="group"
  for (const child of menuEl.children) {
    if (child instanceof HTMLElement && child.querySelector('[role="group"]')) {
      return child;
    }
  }

  return null;
}

/**
 * Attach a MutationObserver on the groups container to detect when the
 * model list (pane === "model") is rendered.  The menu initially renders
 * the root pane (Model/Effort cells), then switches to the model pane
 * on user click.
 */
function attachMenuObserver(menuEl: HTMLElement) {
  if (state.observer) state.observer.disconnect();

  state.observer = new MutationObserver(() => {
    const groupsEl = findGroupsContainer(menuEl);
    if (groupsEl && groupsEl !== state.groupsEl) {
      state.groupsEl = groupsEl;

      // Inject the search input at the top of the groups container
      injectSearchIntoMenu(menuEl, groupsEl);
    }

    // Check if the menu was detached (closed)
    if (!document.body.contains(menuEl)) {
      detachFromMenu();
    }
  });

  state.observer.observe(menuEl, {
    childList: true,
    subtree: true,
  });
}

function injectSearchIntoMenu(menuEl: HTMLElement, groupsEl: HTMLElement) {
  // Don't inject twice
  if (state.searchEl && menuEl.contains(state.searchEl)) return;

  const input = buildSearchUI();
  const container = input.closest(`.${config.containerClass}`) as HTMLElement;

  // Insert the search container before the groups container
  groupsEl.parentNode?.insertBefore(container!, groupsEl);

  state.isActive = true;

  // Focus the search input after a short delay (menu animation)
  setTimeout(() => input.focus(), 80);
}

function detachFromMenu() {
  state.isActive = false;
  state.groupsEl = null;

  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }

  if (state.searchEl) {
    state.searchEl.removeEventListener('input', onSearchInput);
    state.searchEl.removeEventListener('keydown', onSearchKeydown);
    state.searchEl = null;
  }

  if (state.clearEl) {
    state.clearEl.removeEventListener('click', onClearClick);
    state.clearEl = null;
  }

  if (state.noResultsEl) {
    state.noResultsEl.remove();
    state.noResultsEl = null;
  }

  // Remove the search container from DOM
  const container = document.querySelector(`.${config.containerClass}`);
  container?.remove();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  state.menuEl = null;
}

// ──── Document-level observer ───────────────────────────────────────────

function startDocumentObserver() {
  if (state.documentObserver) return;

  state.documentObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;

        // ── fetch-models candidate picker dialog ──
        const pickerList =
          (node.matches?.('ul[class*="candidateList"]') ? node : null) ??
          node.querySelector<HTMLElement>('ul[class*="candidateList"]');
        if (pickerList) {
          pickerState.dialogEl = pickerList;
          attachPickerObserver(document.body);
          // Inject immediately: the list may already be fully rendered when
          // we first see it; waiting for a further mutation delayed the box
          // until the user interacted with the dialog.
          if (pickerList !== pickerState.listEl) {
            pickerState.listEl = pickerList;
            injectSearchIntoPicker(pickerList);
          }
          return;
        }

        if (isModelMenu(node)) {
          state.menuEl = node;
          attachMenuObserver(node);
          return;
        }

        // Check inside added nodes for the menu
        const menu = node.querySelector<HTMLElement>('[role="menu"][aria-label*="model" i],[role="menu"][aria-label*="推理等级"],[role="menu"][aria-label*="effort" i]');
        if (menu) {
          state.menuEl = menu;
          attachMenuObserver(menu);
          return;
        }
      }

      // Check for removed nodes (menu closed)
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          if (node === state.menuEl || node.contains(state.menuEl)) {
            detachFromMenu();
            return;
          }
          if (node === pickerState.dialogEl || node.contains(pickerState.dialogEl)) {
            detachFromPicker();
            return;
          }
        }
      }
    }
  });

  state.documentObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function stopDocumentObserver() {
  if (state.documentObserver) {
    state.documentObserver.disconnect();
    state.documentObserver = null;
  }
}

// ──── Public API ────────────────────────────────────────────────────────

/**
 * Configure the plugin before activation.
 */
function configure(opts?: ModelSearchPluginOptions): void {
  if (opts) {
    config = { ...DEFAULTS, ...opts };
  }
}

/**
 * Activate the plugin: inject CSS, start the document observer.
 */
function activate(): void {
  if (state.isActive) return;

  injectStyles();
  startDocumentObserver();
}

/**
 * Deactivate the plugin: clean up all observers & injected DOM.
 */
function deactivate(): void {
  detachFromMenu();
  detachFromPicker();
  stopDocumentObserver();
  removeStyles();
  state.isActive = false;
}

/**
 * DSH client plugin entry — called by the Cordis Loader.
 *
 * @param ctx  Cordis context (unused by this DOM-based plugin).
 * @param opts Optional configuration.
 */
function apply(ctx: unknown, opts?: ModelSearchPluginOptions): void {
  configure(opts);
  activate();
}

/**
 * Explicit export list — this is what `build-plugin.js` converts into
 * `exports.xxx = xxx` assignments when wrapping the compiled ESM for the
 * `window.__ModuleLoader__.load({ factory })` format. Without a grouped
 * `export { ... }` statement, the built `lib/client.js` would export nothing
 * and the browser-side Cordis Loader would reject it with
 * `invalid plugin, expect function or object with an "apply" method`.
 */
export { configure, activate, deactivate, apply }