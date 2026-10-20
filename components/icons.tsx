import type { SVGProps } from "react";
import type { Category } from "@/data/products";

type P = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const StarIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path
      fill="currentColor"
      stroke="none"
      d="M12 2.6c.4 0 .7.2.9.6l2.3 4.8 5.2.7c.8.1 1.2 1.1.6 1.7l-3.8 3.7.9 5.2c.1.8-.7 1.4-1.5 1L12 17.9l-4.6 2.4c-.8.4-1.6-.2-1.5-1l.9-5.2-3.8-3.7c-.6-.6-.2-1.6.6-1.7l5.2-.7 2.3-4.8c.2-.4.5-.6.9-.6Z"
    />
  </svg>
);

export const CartIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M3 4h2.2l2.3 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.3" />
    <circle cx="10" cy="20.2" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="17.2" cy="20.2" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
);

export const ArrowUpRightIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.4-4.4" />
  </svg>
);

export const ChevronDownIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ArrowLeftIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} strokeWidth={1.8} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

/** Mac: command key glyph (generic, not a logo). */
export const MacGlyph = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M9 9V6.5A2.5 2.5 0 1 0 6.5 9H9Zm0 0v6m0-6h6m-6 6H6.5A2.5 2.5 0 1 0 9 17.5V15Zm0 0h6m0 0v2.5a2.5 2.5 0 1 0 2.5-2.5H15Zm0 0V9m0 0h2.5A2.5 2.5 0 1 0 15 6.5V9Z" />
  </svg>
);

/** Windows: a generic app window (title bar + pane), not a logo. */
export const WindowGlyph = (p: P) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="3" />
    <path d="M3 9h18" />
    <circle cx="6.3" cy="6.8" r=".7" fill="currentColor" stroke="none" />
    <circle cx="8.6" cy="6.8" r=".7" fill="currentColor" stroke="none" />
  </svg>
);

export const CategoryGlyph = ({ category, ...p }: P & { category: Category }) => {
  switch (category) {
    case "Synth":
      return (
        <svg viewBox="0 0 24 24" {...base} {...p}>
          <path d="M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0" />
        </svg>
      );
    case "Effetti":
      return (
        <svg viewBox="0 0 24 24" {...base} {...p}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 12 8 7.5" />
          <path d="M12 2.5v1.5M21.5 12H20M12 21.5V20M2.5 12H4" />
        </svg>
      );
    case "Drum":
      return (
        <svg viewBox="0 0 24 24" {...base} {...p}>
          <rect x="3" y="3" width="8" height="8" rx="2.5" />
          <rect x="13" y="3" width="8" height="8" rx="2.5" />
          <rect x="3" y="13" width="8" height="8" rx="2.5" />
          <rect x="13" y="13" width="8" height="8" rx="2.5" fill="currentColor" />
        </svg>
      );
    case "DAW":
      // Three mixer faders.
      return (
        <svg viewBox="0 0 24 24" {...base} {...p}>
          <path d="M6 4v16M12 4v16M18 4v16" />
          <rect x="4" y="13" width="4" height="3" rx="1" fill="currentColor" />
          <rect x="10" y="7" width="4" height="3" rx="1" fill="currentColor" />
          <rect x="16" y="11" width="4" height="3" rx="1" fill="currentColor" />
        </svg>
      );
    case "Bundle":
      return (
        <svg viewBox="0 0 24 24" {...base} {...p}>
          <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
          <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
        </svg>
      );
  }
};
