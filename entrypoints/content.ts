import { defineContentScript } from "wxt/utils/define-content-script";

export default defineContentScript({
	// run on all pages
	matches: ["<all_urls>"],
	async main() {
		// Track modifier key state (ctrl, shift, alt) and user settings
		const modifiers = { ctrl: false, shift: false, alt: false };
		type Position =
			| "top-left"
			| "top-right"
			| "bottom-left"
			| "bottom-right"
			| "center";
		const settings: {
			key: "ctrl" | "shift" | "alt";
			position: Position;
			background: string;
		} = {
			key: "ctrl",
			position: "bottom-right",
			background: "rgba(0,0,0,0.78)",
		};

		type StorageData = {
			key?: "ctrl" | "shift" | "alt";
			position?: Position;
			background?: string;
			ignoredDomains?: string[];
		};

		// Check if current domain is ignored
		function isDomainIgnored(ignoredDomains: string[]): boolean {
			const hostname = window.location.hostname;
			return ignoredDomains.some((domain) => {
				return hostname === domain || hostname.endsWith("." + domain);
			});
		}

		// Load saved settings before registering anything
		try {
			const stored = await browser.storage.local.get<StorageData>();
			if (
				stored.key &&
				(stored.key === "ctrl" ||
					stored.key === "shift" ||
					stored.key === "alt")
			) {
				settings.key = stored.key;
			}
			if (
				stored.position &&
				(stored.position === "top-left" ||
					stored.position === "top-right" ||
					stored.position === "bottom-left" ||
					stored.position === "bottom-right" ||
					stored.position === "center")
			) {
				settings.position = stored.position;
			}
			if (stored.background) settings.background = stored.background;
			if (
				Array.isArray(stored.ignoredDomains) &&
				isDomainIgnored(stored.ignoredDomains)
			) {
				// Exit early without registering listeners on ignored domains
				return;
			}
		} catch (e) {
			// ignore
		}

		function updateFromKeyboard(e: KeyboardEvent) {
			modifiers.ctrl = e.ctrlKey;
			modifiers.shift = e.shiftKey;
			modifiers.alt = e.altKey;
		}

		function hasConfiguredModifier() {
			return Boolean(modifiers[settings.key]);
		}

		// Remember the last copy to avoid redundant writes/repeat toasts
		let lastCopiedText = "";
		let lastCopiedAt = 0;

		async function tryCopySelection() {
			try {
				let text = "";
				let selectionSource = "none";

				// Check for selection in input/textarea elements
				const activeEl = document.activeElement;
				const isInput = activeEl instanceof HTMLInputElement;
				const isTextarea = activeEl instanceof HTMLTextAreaElement;

				if (
					(isInput || isTextarea) &&
					activeEl &&
					activeEl.selectionStart !== null &&
					activeEl.selectionEnd !== null &&
					activeEl.selectionStart !== activeEl.selectionEnd
				) {
					// Get selected text from input/textarea
					const el = activeEl as HTMLInputElement | HTMLTextAreaElement;
					const start = activeEl.selectionStart as number;
					const end = activeEl.selectionEnd as number;
					text = el.value.substring(start, end);
					selectionSource = isInput ? "input" : "textarea";
				}

				// Also check for regular document selection
				const sel = window.getSelection();
				if (sel) {
					const docText = sel.toString();
					if (docText && docText.trim()) {
						// Prefer document selection if available, otherwise use input/textarea
						if (!text) {
							text = docText;
							selectionSource = "document";
						}
					}
				}

				if (!text || !text.trim()) return false;

				// Always require modifier key
				if (!hasConfiguredModifier()) return false;

				// Skip duplicate copies of the same text within the toast window
				const now = Date.now();
				if (text === lastCopiedText && now - lastCopiedAt < 1500) {
					return true;
				}

				await navigator.clipboard.writeText(text);
				lastCopiedText = text;
				lastCopiedAt = now;
				showToast("copied");
				return true;
			} catch (e) {
				// quietly ignore failures
				console.log("[select2copy] Copy failed:", e);
				return false;
			}
		}

		// Modifier state tracking; copy fires on key release
		window.addEventListener("keydown", updateFromKeyboard, true);
		window.addEventListener("keyup", (e) => {
			// During the keyup of the modifier key itself, e.ctrlKey/e.shiftKey/e.altKey
			// is still true, so releasing it at the end of a selection still copies.
			if (hasConfiguredModifier()) setTimeout(tryCopySelection, 0);
			updateFromKeyboard(e);
		}, true);
		window.addEventListener("blur", () => {
			modifiers.ctrl = modifiers.shift = modifiers.alt = false;
		});

		// When pointer-based selection finishes (mouse/touch)
		const scheduleCopy = () => {
			setTimeout(tryCopySelection, 0);
		};
		document.addEventListener("pointerup", scheduleCopy);
		document.addEventListener("mouseup", scheduleCopy);
		document.addEventListener("touchend", scheduleCopy);

		// Tiny toast notification shown after successful copy
		function ensureToast() {
			const id = "__xselect2copy_toast";
			let el = document.getElementById(id) as HTMLDivElement | null;
			if (el) return el;
			el = document.createElement("div");
			el.id = id;
			Object.assign(el.style, {
				position: "fixed",
				color: "white",
				padding: "8px 12px",
				borderRadius: "6px",
				fontSize: "13px",
				zIndex: String(2147483647),
				opacity: "0",
				transition: "opacity 180ms ease, transform 180ms ease",
				transform: "translateY(8px)",
				pointerEvents: "none",
			} as CSSStyleDeclaration);
			document.documentElement.appendChild(el);
			applyToastPosition();
			applyToastBackground();
			return el;
		}

		function applyToastBackground() {
			const el = document.getElementById(
				"__xselect2copy_toast",
			) as HTMLDivElement | null;
			if (!el) return;
			el.style.background = settings.background || "rgba(0,0,0,0.78)";
		}

		function applyToastPosition() {
			const el = document.getElementById(
				"__xselect2copy_toast",
			) as HTMLDivElement | null;
			if (!el) return;
			// reset
			el.style.left = "";
			el.style.right = "";
			el.style.top = "";
			el.style.bottom = "";
			el.style.transform = "translateY(0)";
			switch (settings.position) {
				case "top-left":
					el.style.left = "12px";
					el.style.top = "12px";
					break;
				case "top-right":
					el.style.right = "12px";
					el.style.top = "12px";
					break;
				case "bottom-left":
					el.style.left = "12px";
					el.style.bottom = "12px";
					break;
				case "center":
					el.style.left = "50%";
					el.style.top = "50%";
					el.style.transform = "translate(-50%, -50%)";
					break;
				case "bottom-right":
				default:
					el.style.right = "12px";
					el.style.bottom = "12px";
					break;
			}
		}

		let toastTimer: number | null = null;
		function showToast(text = "copied") {
			const el = ensureToast();
			el.textContent = text;
			applyToastBackground();
			applyToastPosition();
			el.style.opacity = "1";
			// for center we already set transform, keep it
			if (settings.position !== "center") el.style.transform = "translateY(0)";
			if (toastTimer) {
				clearTimeout(toastTimer);
			}
			toastTimer = window.setTimeout(() => {
				el.style.opacity = "0";
				if (settings.position !== "center")
					el.style.transform = "translateY(8px)";
				toastTimer = null;
			}, 1200);
		}

		// listen for changes from options page
		try {
			browser.storage.onChanged.addListener((changes, areaName) => {
				if (areaName !== "local") return;

				if (
					changes.key?.newValue &&
					(changes.key.newValue === "ctrl" ||
						changes.key.newValue === "shift" ||
						changes.key.newValue === "alt")
				) {
					settings.key = changes.key.newValue;
				}
				if (
					changes.position?.newValue &&
					(changes.position.newValue === "top-left" ||
						changes.position.newValue === "top-right" ||
						changes.position.newValue === "bottom-left" ||
						changes.position.newValue === "bottom-right" ||
						changes.position.newValue === "center")
				) {
					settings.position = changes.position.newValue;
				}
				if (
					changes.background?.newValue &&
					typeof changes.background.newValue === "string"
				) {
					settings.background = changes.background.newValue;
				}
				applyToastBackground();
				applyToastPosition();
			});
		} catch (e) {
			// ignore if browser API missing
		}
	},
});
