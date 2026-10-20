/**
 * SVG filters used inside `backdrop-filter: url(#…)` (Chromium only; other
 * browsers get the blur fallback from globals.css).
 * - lg-refract: low-frequency displacement, a gentle lens rather than grain (Apple-style)
 * - lg-bubble: stronger displacement split per channel for chromatic edges
 */
export function LiquidGlassDefs() {
  return (
    <svg
      aria-hidden
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter id="lg-refract" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.005" numOctaves={1} seed={7} result="noise" />
          <feGaussianBlur in="noise" stdDeviation="4" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={30} xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <filter id="lg-bubble" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={1} seed={3} result="noise" />
          <feGaussianBlur in="noise" stdDeviation="3" result="map" />

          <feDisplacementMap in="SourceGraphic" in2="map" scale={56} xChannelSelector="R" yChannelSelector="G" result="dr" />
          <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={64} xChannelSelector="R" yChannelSelector="G" result="dg" />
          <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={72} xChannelSelector="R" yChannelSelector="G" result="db" />
          <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />

          <feBlend in="r" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
