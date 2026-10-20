"use client";

import { gsap, Flip, REDUCED_MOTION } from "./gsap";

export const CART_BUMP_EVENT = "starplugzz:cart-bump";

const bump = () => window.dispatchEvent(new Event(CART_BUMP_EVENT));

/**
 * Clones `source` (the product image), then Flips the clone from where it sits
 * into the navbar cart icon. The cart button bumps when it lands.
 */
export function flyToCart(source: HTMLElement | null) {
  const target = document.querySelector<HTMLElement>("[data-cart-target]");
  if (!source || !target || window.matchMedia(REDUCED_MOTION).matches) {
    bump();
    return;
  }

  const from = source.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "60",
    pointerEvents: "none",
    overflow: "hidden",
    borderRadius: "22px",
    boxShadow: "0 18px 40px -12px rgb(11 30 74 / 0.5)",
  });
  document.body.appendChild(ghost);

  const state = Flip.getState(ghost, { props: "borderRadius,opacity" });

  const to = target.getBoundingClientRect();
  const size = 24;
  Object.assign(ghost.style, {
    left: `${to.left + to.width / 2 - size / 2}px`,
    top: `${to.top + to.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    opacity: "0.6",
  });

  Flip.from(state, {
    duration: 0.72,
    ease: "power3.inOut",
    absolute: true,
    onComplete: () => {
      ghost.remove();
      bump();
    },
  });

  // A small lift at take-off so it reads as being picked up, not teleported.
  gsap.fromTo(ghost, { rotation: 0 }, { rotation: -8, duration: 0.72, ease: "sine.inOut" });
}
