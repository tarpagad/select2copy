export default defineContentScript({
  // run on all pages
  matches: ['<all_urls>'],
  async main() {
    // Track modifier key state (ctrl, shift, alt) and user settings
    const modifiers = { ctrl: false, shift: false, alt: false };
    type Position = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    const settings: {
      key: 'ctrl' | 'shift' | 'alt';
      position: Position;
      background: string;
    } = {
      key: 'ctrl',
      position: 'bottom-right',
      background: 'rgba(0,0,0,0.78)',
    };

    function updateFromKeyboard(e: KeyboardEvent) {
      modifiers.ctrl = e.ctrlKey;
      modifiers.shift = e.shiftKey;
      modifiers.alt = e.altKey;
    }

    window.addEventListener('keydown', updateFromKeyboard, true);
    window.addEventListener('keyup', updateFromKeyboard, true);
    window.addEventListener('blur', () => {
      modifiers.ctrl = modifiers.shift = modifiers.alt = false;
    });

    function hasConfiguredModifier() {
      return Boolean(modifiers[settings.key]);
    }

    async function tryCopySelection() {
      try {
        const sel = window.getSelection();
        if (!sel) return false;
        const text = sel.toString();
        if (!text || !text.trim()) return false;
        if (!hasConfiguredModifier()) return false;
        await navigator.clipboard.writeText(text);
        showToast('copied');
        return true;
      } catch (e) {
        // quietly ignore failures
        return false;
      }
    }

    // When selection changes (keyboard selections like shift+arrows)
    document.addEventListener('selectionchange', () => {
      if (hasConfiguredModifier()) tryCopySelection();
    });

    // When pointer-based selection finishes (mouse/touch)
    const scheduleCopy = () => setTimeout(tryCopySelection, 0);
    document.addEventListener('pointerup', scheduleCopy);
    document.addEventListener('mouseup', scheduleCopy);
    document.addEventListener('touchend', scheduleCopy);
    // Tiny toast notification shown after successful copy
    function ensureToast() {
      const id = '__xselect2copy_toast';
      let el = document.getElementById(id) as HTMLDivElement | null;
      if (el) return el;
      el = document.createElement('div');
      el.id = id;
      Object.assign(el.style, {
        position: 'fixed',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        zIndex: String(2147483647),
        opacity: '0',
        transition: 'opacity 180ms ease, transform 180ms ease',
        transform: 'translateY(8px)',
        pointerEvents: 'none',
      } as CSSStyleDeclaration);
      document.documentElement.appendChild(el);
      applyToastPosition();
      applyToastBackground();
      return el;
    }

    function applyToastBackground() {
      const el = document.getElementById('__xselect2copy_toast') as HTMLDivElement | null;
      if (!el) return;
      el.style.background = settings.background || 'rgba(0,0,0,0.78)';
    }

    function applyToastPosition() {
      const el = document.getElementById('__xselect2copy_toast') as HTMLDivElement | null;
      if (!el) return;
      // reset
      el.style.left = '';
      el.style.right = '';
      el.style.top = '';
      el.style.bottom = '';
      el.style.transform = 'translateY(0)';
      switch (settings.position) {
        case 'top-left':
          el.style.left = '12px';
          el.style.top = '12px';
          break;
        case 'top-right':
          el.style.right = '12px';
          el.style.top = '12px';
          break;
        case 'bottom-left':
          el.style.left = '12px';
          el.style.bottom = '12px';
          break;
        case 'center':
          el.style.left = '50%';
          el.style.top = '50%';
          el.style.transform = 'translate(-50%, -50%)';
          break;
        case 'bottom-right':
        default:
          el.style.right = '12px';
          el.style.bottom = '12px';
          break;
      }
    }

    let toastTimer: number | null = null;
    function showToast(text = 'copied') {
      const el = ensureToast();
      el.textContent = text;
      applyToastBackground();
      applyToastPosition();
      el.style.opacity = '1';
      // for center we already set transform, keep it
      if (settings.position !== 'center') el.style.transform = 'translateY(0)';
      if (toastTimer) {
        clearTimeout(toastTimer);
      }
      toastTimer = window.setTimeout(() => {
        el.style.opacity = '0';
        if (settings.position !== 'center') el.style.transform = 'translateY(8px)';
        toastTimer = null;
      }, 1200);
    }

    // Check if current domain is ignored
    function isDomainIgnored(ignoredDomains: string[]): boolean {
      const hostname = window.location.hostname;
      return ignoredDomains.some((domain) => {
        return hostname === domain || hostname.endsWith('.' + domain);
      });
    }

    // load saved settings
    try {
      // @ts-ignore
      const stored = await browser.storage.local.get();
      if (stored && stored.key) settings.key = stored.key;
      if (stored && stored.position) settings.position = stored.position;
      if (stored && stored.background) settings.background = stored.background;
      if (stored && Array.isArray(stored.ignoredDomains) && isDomainIgnored(stored.ignoredDomains)) {
        // Exit early if domain is ignored
        return;
      }
    } catch (e) {
      // ignore
    }

    // listen for changes from options page
    try {
      // @ts-ignore
      browser.storage.onChanged.addListener((changes: any) => {
        if (changes.key && changes.key.newValue) settings.key = changes.key.newValue;
        if (changes.position && changes.position.newValue) settings.position = changes.position.newValue;
        if (changes.background && changes.background.newValue) settings.background = changes.background.newValue;
        applyToastBackground();
        applyToastPosition();
      });
    } catch (e) {
      // ignore if browser API missing
    }
  },
});
