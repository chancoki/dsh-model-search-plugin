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
export declare const DEFAULT_OPTIONS: Required<ModelSearchPluginOptions>;
/**
 * DSH design system CSS variable names.
 */
export declare const DSH_CSS_VARS: {
    bgMenu: string;
    labelPrimary: string;
    labelSecondary: string;
    labelTertiary: string;
    labelCaption: string;
    interactiveBgHover: string;
    borderInverted: string;
    borderL3: string;
    scrollbarBgL2: string;
    scrollbarHoverL2: string;
    shadowLv3: string;
    stateErrorPrimary: string;
    stateWarnLabel: string;
    bgModulePlatform: string;
};
//# sourceMappingURL=types.d.ts.map