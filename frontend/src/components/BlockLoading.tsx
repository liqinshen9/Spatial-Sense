import type { CSSProperties } from "react";

type BlockLoadingProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClassNames = {
  sm: "block-loading-sm",
  md: "block-loading-md",
  lg: "block-loading-lg",
};

function BlockLoading({
  label = "Loading...",
  size = "md",
  className = "",
}: BlockLoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}
    >
      <div
        className={`block-loading-grid ${sizeClassNames[size]}`}
        aria-hidden="true"
      >
        {Array.from({ length: 9 }, (_, index) => (
          <span
            key={index}
            style={{ "--block-index": index } as CSSProperties}
          />
        ))}
      </div>

      {label && (
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-text-primary)] opacity-65">
          {label}
        </p>
      )}
    </div>
  );
}

export default BlockLoading;