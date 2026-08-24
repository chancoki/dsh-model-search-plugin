/**
 * Configuration options for the DSH Model Search Plugin.
 */
export interface ModelSearchPluginOptions {
  /**
   * Placeholder text for the search input.
   * @default "搜索模型..."
   */
  placeholder?: string;

  /**
   * Debounce delay in milliseconds before filtering.
   * @default 200
   */
  debounceDelay?: number;

  /**
   * Whether to hide unmatched model options.
   * @default true
   */
  hideUnmatched?: boolean;

  /**
   * Keyboard shortcut to focus the search input (key from KeyboardEvent.key).
   * Set to empty string to disable.
   * @default "f"
   */
  focusHotkey?: string;

  /**
   * Whether Ctrl/Meta key is required for the focus shortcut.
   * @default true
   */
  focusRequiresModifier?: boolean;

  /**
   * Minimum query length before filtering starts.
   * @default 0
   */
  minQueryLength?: number;

  /**
   * CSS class name for the search container.
   * Used for internal identification.
   */
  containerClass?: string;

  /**
   * CSS class name for the search input.
   */
  inputClass?: string;

  /**
   * Whether to show a "no results" indicator.
   * @default true
   */
  showNoResults?: boolean;
}

/**
 * Internal state of the search plugin.
 */
export interface PluginState {
  menuEl: HTMLElement | null;
  groupsEl: HTMLElement | null;
  searchEl: HTMLInputElement | null;
  clearEl: HTMLElement | null;
  noResultsEl: HTMLElement | null;
  observer: MutationObserver | null;
  isActive: boolean;
  menuCleanup: (() => void) | null;
}

/**
 * Default plugin options.
 */
export const DEFAULT_OPTIONS: Required<ModelSearchPluginOptions> = {
  placeholder: '搜索模型...',
  debounceDelay: 200,
  hideUnmatched: true,
  focusHotkey: 'f',
  focusRequiresModifier: true,
  minQueryLength: 0,
  containerClass: 'dsh-model-search-container',
  inputClass: 'dsh-model-search-input',
  showNoResults: true,
};

/**
 * DSH design system CSS variable names.
 */
export const DSH_CSS_VARS = {
  bgMenu: 'var(--dsw-specific-menu)',
  labelPrimary: 'var(--dsw-alias-label-primary)',
  labelSecondary: 'var(--dsw-alias-label-secondary)',
  labelTertiary: 'var(--dsw-alias-label-tertiary)',
  labelCaption: 'var(--dsw-alias-label-caption)',
  interactiveBgHover: 'var(--dsw-alias-interactive-bg-hover)',
  borderInverted: 'var(--dsw-alias-border-inverted)',
  borderL3: 'var(--dsw-alias-border-l3)',
  scrollbarBgL2: 'var(--dsw-alias-scrollbar-bg-l2)',
  scrollbarHoverL2: 'var(--dsw-alias-scrollbar-hover-l2)',
  shadowLv3: 'var(--dsw-shadow-lv3)',
  stateErrorPrimary: 'var(--dsw-alias-state-error-primary)',
  stateWarnLabel: 'var(--dsw-alias-state-warn-label)',
  bgModulePlatform: 'var(--dsw-alias-bg-module-platform)',
};