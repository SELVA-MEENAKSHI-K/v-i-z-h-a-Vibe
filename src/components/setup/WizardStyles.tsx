// Wizard scoped styles, extracted verbatim from SetupWizard.tsx. These are
// declared `<style jsx global>` so they inject the same global CSS regardless
// of which component renders them — the styling behaviour is unchanged.
export function WizardStyles() {
  return (
    <style jsx global>{`
      .vv-input {
        width: 100%;
        border-radius: 0.7rem;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.6rem 0.8rem;
        color: #f4f1ea;
        font-size: 0.95rem;
        transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      }
      .vv-input:focus {
        outline: none;
        border-color: #ff9e2c;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 4px rgba(255, 158, 44, 0.18);
      }
      .vv-input::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }
      .vv-input-lg {
        font-size: 1.15rem;
        padding: 0.8rem 1rem;
      }
      .vv-wiz-card {
        background: rgba(20, 14, 34, 0.68);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 30px 80px -30px rgba(0, 0, 0, 0.7);
      }
      .vv-mini {
        border-radius: 9999px;
        padding: 0.2rem 0.7rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.75);
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: all 0.2s;
      }
      .vv-mini:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
      }
      .vv-mini-on {
        background: rgba(255, 158, 44, 0.9);
        color: #0b0a14;
        border-color: transparent;
        font-weight: 600;
      }
      .vv-range {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 8px;
        border-radius: 9999px;
        outline: none;
        cursor: pointer;
        background: linear-gradient(to right, #ff9e2c 0%, #ffd24c var(--p, 50%), rgba(255, 255, 255, 0.12) var(--p, 50%));
      }
      .vv-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 9999px;
        background: #fff;
        border: 4px solid #ff9e2c;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
        transition: transform 0.15s;
      }
      .vv-range::-webkit-slider-thumb:hover {
        transform: scale(1.15);
      }
      .vv-range::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: #fff;
        border: 4px solid #ff9e2c;
      }
      .vv-range:focus-visible {
        box-shadow: 0 0 0 4px rgba(255, 158, 44, 0.25);
      }
      .vv-step {
        animation: vv-step-in 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }
      @keyframes vv-step-in {
        from {
          opacity: 0;
          transform: translateX(22px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .vv-rise {
        animation: vv-rise-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }
      @keyframes vv-rise-in {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .vv-pop {
        animation: vv-pop-in 0.35s cubic-bezier(0.3, 1.5, 0.5, 1) both;
      }
      @keyframes vv-pop-in {
        from {
          transform: scale(0.94);
          opacity: 0.6;
        }
        to {
          transform: none;
          opacity: 1;
        }
      }
      .vv-fade {
        animation: vv-fade-in 0.5s ease both;
      }
      @keyframes vv-fade-in {
        from {
          opacity: 0;
          transform: scale(1.04);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .vv-shake {
        animation: vv-shake-x 0.4s ease both;
      }
      @keyframes vv-shake-x {
        20%,
        60% {
          transform: translateX(-6px);
        }
        40%,
        80% {
          transform: translateX(6px);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .vv-step,
        .vv-rise,
        .vv-pop,
        .vv-fade,
        .vv-shake {
          animation: none !important;
        }
      }
    `}</style>
  );
}
