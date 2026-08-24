/**
 * DSH Model Search Plugin — standalone bundle
 *
 * Load this file as a regular <script> tag in the DSH Web GUI page
 * to add keyword search to the model selection dropdown.
 *
 * Usage:
 *   <script src="dsh-model-search-plugin.js"></script>
 *   <script> DSHModelSearchPlugin.activate() </script>
 *
 * Or in the browser DevTools console:
 *   DSHModelSearchPlugin.activate()
 */
(function () {
  'use strict';

  // ── options ────────────────────────────────────────────────────────
  var DEFAULTS = {
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

  var CSS_VARS = {
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

  var CSS_ID = 'dsh-model-search-plugin-style';
  var CSS = [
    '.' + DEFAULTS.containerClass + ' {',
    '  flex: none; padding: 4px 6px 0;',
    '}',
    '.' + DEFAULTS.containerClass + ' .search-wrapper {',
    '  position: relative; display: flex; align-items: center;',
    '}',
    '.' + DEFAULTS.inputClass + ' {',
    '  width: 100%; height: 28px;',
    '  padding: 0 24px 0 8px;',
    '  border: 1px solid ' + CSS_VARS.borderInverted + ';',
    '  border-radius: 6px;',
    '  background: transparent;',
    '  color: ' + CSS_VARS.labelPrimary + ';',
    '  font-size: 13px; line-height: 20px;',
    '  outline: none;',
    '  transition: border-color .15s, box-shadow .15s;',
    '}',
    '.' + DEFAULTS.inputClass + '::placeholder {',
    '  color: ' + CSS_VARS.labelCaption + ';',
    '}',
    '.' + DEFAULTS.inputClass + ':focus {',
    '  border-color: #4f8cff;',
    '  box-shadow: 0 0 0 2px rgba(79,140,255,.25);',
    '}',
    '.' + DEFAULTS.inputClass + '.has-value + .search-clear-btn {',
    '  display: flex;',
    '}',
    '.search-clear-btn {',
    '  display: none; position: absolute;',
    '  right: 4px; top: 50%; transform: translateY(-50%);',
    '  width: 18px; height: 18px;',
    '  align-items: center; justify-content: center;',
    '  border: none; border-radius: 4px;',
    '  background: transparent;',
    '  color: ' + CSS_VARS.labelCaption + ';',
    '  cursor: pointer; font-size: 14px; line-height: 1; padding: 0;',
    '  transition: color .15s;',
    '}',
    '.search-clear-btn:hover {',
    '  color: ' + CSS_VARS.labelPrimary + ';',
    '}',
    '.search-no-results {',
    '  padding: 6px 8px;',
    '  color: ' + CSS_VARS.labelTertiary + ';',
    '  font-size: 12px; line-height: 18px; text-align: center;',
    '}',
    '.' + DEFAULTS.inputClass + '.no-results {',
    '  border-color: ' + CSS_VARS.stateErrorPrimary + ';',
    '}',
  ].join('\n');

  // ── state ──────────────────────────────────────────────────────────
  var opts = {};
  var state = {
    menuEl: null,
    groupsEl: null,
    searchEl: null,
    clearEl: null,
    noResultsEl: null,
    observer: null,
    documentObserver: null,
    isActive: false,
  };
  var debounceTimer = null;

  function resetOpts() {
    for (var k in DEFAULTS) {
      if (DEFAULTS.hasOwnProperty(k)) opts[k] = DEFAULTS[k];
    }
  }
  resetOpts();

  // ── styles ─────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById(CSS_ID)) return;
    var style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function removeStyles() {
    var el = document.getElementById(CSS_ID);
    if (el) el.remove();
  }

  // ── search UI ──────────────────────────────────────────────────────
  function buildSearchUI() {
    var container = document.createElement('div');
    container.className = opts.containerClass;

    var wrapper = document.createElement('div');
    wrapper.className = 'search-wrapper';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = opts.inputClass;
    input.placeholder = opts.placeholder;
    input.spellcheck = false;
    input.autocomplete = 'off';

    var clearBtn = document.createElement('button');
    clearBtn.className = 'search-clear-btn';
    clearBtn.type = 'button';
    clearBtn.textContent = '\u2715';
    clearBtn.setAttribute('aria-label', 'Clear search');

    wrapper.appendChild(input);
    wrapper.appendChild(clearBtn);
    container.appendChild(wrapper);

    state.searchEl = input;
    state.clearEl = clearBtn;

    input.addEventListener('input', onSearchInput);
    input.addEventListener('keydown', onSearchKeydown);
    clearBtn.addEventListener('click', onClearClick);
    document.addEventListener('keydown', onGlobalKeydown);

    return input;
  }

  // ── event handlers ─────────────────────────────────────────────────
  function onSearchInput() {
    var el = state.searchEl;
    if (!el) return;
    var hasValue = el.value.length > 0;
    el.classList.toggle('has-value', hasValue);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      performSearch(el.value);
    }, opts.debounceDelay);
  }

  function onSearchKeydown(e) {
    if (e.key === 'Escape') {
      var el = state.searchEl;
      if (el && el.value) {
        el.value = '';
        el.classList.remove('has-value');
        performSearch('');
      } else if (el) {
        el.blur();
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      performSearch(state.searchEl ? state.searchEl.value : '');
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown' && state.groupsEl) {
      var firstOption = state.groupsEl.querySelector('[role="menuitemradio"]');
      if (firstOption) firstOption.focus();
      e.preventDefault();
    }
  }

  function onClearClick() {
    var el = state.searchEl;
    if (el) {
      el.value = '';
      el.classList.remove('has-value');
      performSearch('');
      el.focus();
    }
  }

  function onGlobalKeydown(e) {
    if (!opts.focusHotkey) return;
    if (e.key !== opts.focusHotkey) return;
    if (opts.focusRequiresModifier && !(e.metaKey || e.ctrlKey)) return;
    if (!state.isActive) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    if (state.searchEl) state.searchEl.focus();
  }

  // ── search / filter ────────────────────────────────────────────────
  function performSearch(query) {
    var groupsEl = state.groupsEl;
    if (!groupsEl) return;

    var q = query.trim().toLowerCase();

    if (q.length < opts.minQueryLength) {
      // show all
      var allOptions = groupsEl.querySelectorAll('[role="menuitemradio"]');
      for (var i = 0; i < allOptions.length; i++) {
        allOptions[i].style.display = '';
        allOptions[i].classList.remove('model-search-match');
      }
      var allSections = groupsEl.querySelectorAll('section[role="group"]');
      for (var j = 0; j < allSections.length; j++) {
        allSections[j].style.display = '';
      }
      showNoResults(false);
      return;
    }

    var totalMatches = 0;
    var sections = groupsEl.querySelectorAll('section[role="group"]');

    for (var s = 0; s < sections.length; s++) {
      var section = sections[s];
      var options = section.querySelectorAll('[role="menuitemradio"]');
      var sectionMatches = 0;

      for (var o = 0; o < options.length; o++) {
        var opt = options[o];
        var text = (opt.textContent || '').toLowerCase();
        var matches = text.indexOf(q) !== -1;

        if (matches) {
          opt.style.display = '';
          opt.classList.add('model-search-match');
          sectionMatches++;
          totalMatches++;
        } else {
          opt.style.display = opts.hideUnmatched ? 'none' : '';
          opt.classList.remove('model-search-match');
        }
      }

      if (opts.hideUnmatched) {
        section.style.display = sectionMatches === 0 ? 'none' : '';
      } else {
        section.style.display = '';
      }
    }

    showNoResults(opts.showNoResults && totalMatches === 0 && q.length > 0);
  }

  function showNoResults(show) {
    if (!state.noResultsEl) {
      var el = document.createElement('div');
      el.className = 'search-no-results';
      el.textContent = '\u6CA1\u6709\u5339\u914D\u7684\u6A21\u578B';
      state.noResultsEl = el;
    }

    if (show) {
      if (state.groupsEl && !state.noResultsEl.parentNode) {
        state.groupsEl.parentNode.insertBefore(state.noResultsEl, state.groupsEl);
      }
      state.noResultsEl.style.display = '';
      if (state.searchEl) state.searchEl.classList.add('no-results');
    } else {
      state.noResultsEl.style.display = 'none';
      if (state.searchEl) state.searchEl.classList.remove('no-results');
    }
  }

  // ── menu detection ─────────────────────────────────────────────────
  function isModelMenu(el) {
    if (el && el.getAttribute && el.getAttribute('role') === 'menu') {
      var label = (el.getAttribute('aria-label') || '').toLowerCase();
      if (label.indexOf('model') !== -1 ||
          label.indexOf('\u63A8\u7406\u7B49\u7EA7') !== -1 ||
          label.indexOf('effort') !== -1) {
        return true;
      }
    }
    var nested = el.querySelector('[role="menu"][aria-label*="model" i], [role="menu"][aria-label*="\u63A8\u7406\u7B49\u7EA7"], [role="menu"][aria-label*="effort" i]');
    return nested !== null;
  }

  function findGroupsContainer(menuEl) {
    var groupsWrapper = menuEl.querySelector('div:not([role])');
    if (groupsWrapper && groupsWrapper.querySelector('[role="group"]')) {
      return groupsWrapper;
    }
    for (var i = 0; i < menuEl.children.length; i++) {
      var child = menuEl.children[i];
      if (child instanceof HTMLElement && child.querySelector('[role="group"]')) {
        return child;
      }
    }
    return null;
  }

  function attachMenuObserver(menuEl) {
    if (state.observer) state.observer.disconnect();

    state.observer = new MutationObserver(function () {
      var groupsEl = findGroupsContainer(menuEl);
      if (groupsEl && groupsEl !== state.groupsEl) {
        state.groupsEl = groupsEl;
        injectSearchIntoMenu(menuEl, groupsEl);
      }
      if (!document.body.contains(menuEl)) {
        detachFromMenu();
      }
    });

    state.observer.observe(menuEl, { childList: true, subtree: true });
  }

  function injectSearchIntoMenu(menuEl, groupsEl) {
    if (state.searchEl && menuEl.contains(state.searchEl)) return;

    var input = buildSearchUI();
    var container = input.closest('.' + opts.containerClass);

    groupsEl.parentNode.insertBefore(container, groupsEl);
    state.isActive = true;

    setTimeout(function () { input.focus(); }, 80);
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
      document.removeEventListener('keydown', onGlobalKeydown);
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

    var container = document.querySelector('.' + opts.containerClass);
    if (container) container.remove();

    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }

    state.menuEl = null;
  }

  function startDocumentObserver() {
    if (state.documentObserver) return;

    state.documentObserver = new MutationObserver(function (mutations) {
      for (var m = 0; m < mutations.length; m++) {
        var mutation = mutations[m];

        for (var n = 0; n < mutation.addedNodes.length; n++) {
          var node = mutation.addedNodes[n];
          if (node instanceof HTMLElement && isModelMenu(node)) {
            state.menuEl = node;
            attachMenuObserver(node);
            return;
          }
          if (node instanceof HTMLElement) {
            var menu = node.querySelector('[role="menu"][aria-label*="model" i], [role="menu"][aria-label*="\u63A8\u7406\u7B49\u7EA7"], [role="menu"][aria-label*="effort" i]');
            if (menu) {
              state.menuEl = menu;
              attachMenuObserver(menu);
              return;
            }
          }
        }

        for (var r = 0; r < mutation.removedNodes.length; r++) {
          var removed = mutation.removedNodes[r];
          if (removed instanceof HTMLElement) {
            if (removed === state.menuEl || (state.menuEl && removed.contains(state.menuEl))) {
              detachFromMenu();
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

  // ── public API ──────────────────────────────────────────────────────
  var api = {
    /** Configure the plugin before activation. */
    configure: function (options) {
      if (options) {
        for (var k in options) {
          if (options.hasOwnProperty(k) && DEFAULTS.hasOwnProperty(k)) {
            opts[k] = options[k];
          }
        }
      }
      return api;
    },

    /** Activate the plugin: inject styles + start observing. */
    activate: function () {
      if (state.isActive) return api;
      injectStyles();
      startDocumentObserver();
      return api;
    },

    /** Deactivate the plugin: remove all injected DOM and observers. */
    deactivate: function () {
      detachFromMenu();
      stopDocumentObserver();
      removeStyles();
      state.isActive = false;
      return api;
    },

    /** DSH client plugin entry point. */
    apply: function (ctx, options) {
      if (options) api.configure(options);
      api.activate();
      return api;
    },

    /** Check current state. */
    isActive: function () { return state.isActive; },
  };

  // Expose globally
  window.DSHModelSearchPlugin = api;
})();