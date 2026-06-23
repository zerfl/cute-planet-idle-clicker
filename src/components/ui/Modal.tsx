/**
 * Shared Modal base component.
 *
 * Handles all cross-cutting modal concerns once, so individual modals only
 * need to provide content:
 *  - Renders via createPortal into #modal-root (escapes layout stacking ctx)
 *  - Single backdrop-blur-sm overlay (no per-panel blur)
 *  - AnimatePresence enter + exit animations
 *  - Escape key to close
 *  - Backdrop click to close
 *  - Body scroll lock (ref-counted for nested modals)
 *  - Focus trap (locks Tab/Shift+Tab inside the panel)
 *  - Restores focus to the previously-focused element on close
 *
 * Usage:
 *   <Modal isOpen={show} onClose={() => setShow(false)} panelClassName="...">
 *     {content}
 *   </Modal>
 */

import React, { useEffect, useRef, useCallback, useContext, createContext, ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

// ---------------------------------------------------------------------------
// ModalSettingsContext — lets GameModalsContainer set disableAnimations once
// for all child modals without threading the prop through every modal file.
// ---------------------------------------------------------------------------
interface ModalSettings {
  disableAnimations: boolean;
}

const ModalSettingsContext = createContext<ModalSettings>({ disableAnimations: false });

export const ModalSettingsProvider: React.FC<{
  disableAnimations: boolean;
  children: ReactNode;
}> = ({ disableAnimations, children }) => (
  <ModalSettingsContext.Provider value={{ disableAnimations }}>
    {children}
  </ModalSettingsContext.Provider>
);

// ---------------------------------------------------------------------------
// Scroll-lock ref counter so stacked modals don't fight over body overflow.
// ---------------------------------------------------------------------------
let scrollLockCount = 0;

function lockScroll() {
  scrollLockCount++;
  if (scrollLockCount === 1) {
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.dataset.scrollY = String(scrollY);
  }
}

function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    const scrollY = Number(document.body.dataset.scrollY ?? "0");
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
  }
}

// ---------------------------------------------------------------------------
// Focus trap helpers
// ---------------------------------------------------------------------------
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest("[aria-hidden='true']"),
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;

  /**
   * Tailwind classes for the panel div.
   * The component adds `modal-frame-target` automatically so the cosmetic
   * frame CSS still works.
   */
  panelClassName?: string;

  /**
   * When true the motion entrance/exit is skipped (low-memory / reduced-motion).
   */
  disableAnimations?: boolean;

  /**
   * When true, `modal-frame-target` is NOT added to the panel class.
   * Use for modals whose panel is not a standard card (e.g. full-bleed image panels).
   */
  skipFrameTarget?: boolean;

  /**
   * When false, clicking the backdrop does NOT close the modal.
   * Defaults to true.
   */
  closeOnBackdrop?: boolean;

  /**
   * Override the backdrop div's className entirely.
   * Default: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/65 backdrop-blur-sm"
   */
  backdropClassName?: string;

  /** Inline styles applied to the panel motion.div (e.g. backgroundImage). */
  panelStyle?: React.CSSProperties;

  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  panelClassName = "",
  disableAnimations: disableAnimationsProp,
  closeOnBackdrop = true,
  skipFrameTarget = false,
  backdropClassName,
  panelStyle,
  children,
}) => {
  const { disableAnimations: disableAnimationsCtx } = useContext(ModalSettingsContext);
  const disableAnimations = disableAnimationsProp ?? disableAnimationsCtx;
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // --- Scroll lock ---
  useEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => unlockScroll();
  }, [isOpen]);

  // --- Save/restore focus ---
  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    // Move focus into the panel on open
    requestAnimationFrame(() => {
      const first = panelRef.current && getFocusable(panelRef.current)[0];
      if (first) first.focus();
    });
    return () => {
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  // --- Escape key ---
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // --- Focus trap ---
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = getFocusable(panelRef.current);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // --- Backdrop click ---
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose],
  );

  // Render into portal
  const portalTarget =
    typeof document !== "undefined"
      ? (document.getElementById("modal-root") ?? document.body)
      : null;

  const isGlitchedCtx =
    typeof document !== "undefined" && document.body.classList.contains("glitch-galaxy-active");

  if (!portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // Overlay — single backdrop-blur-sm; NO panel-level blur
        <div
          className={
            backdropClassName ??
            `fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/65 ${disableAnimations ? "" : "backdrop-blur-sm"}`
          }
          onClick={handleBackdropClick}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            ref={panelRef}
            // Standard enter/exit
            initial={disableAnimations ? false : { scale: 0.95, opacity: 0, y: 15 }}
            animate={disableAnimations ? {} : { scale: 1, opacity: 1, y: 0 }}
            exit={disableAnimations ? {} : { scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`${skipFrameTarget ? "" : "modal-frame-target "}${panelClassName} ${
              isGlitchedCtx
                ? " !bg-black !text-cyan-400 !border-cyan-500 shadow-[0_0_35px_rgba(6,182,212,0.6)] border-4 select-none glitch-text-anim font-mono "
                : ""
            }`}
            style={panelStyle}
            onKeyDown={handleKeyDown}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portalTarget,
  );
};
