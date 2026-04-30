interface LogoProps {
  size?: "sm" | "default";
  variant?: "light" | "dark";
}

export default function Logo({ size = "default", variant = "dark" }: LogoProps) {
  const isSmall = size === "sm";
  const textColor = variant === "light" ? "text-white" : "text-primary-900";

  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`${isSmall ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl shadow-gold"} bg-gold-400 flex items-center justify-center`}
      >
        <svg
          className={`${isSmall ? "w-4 h-4" : "w-5 h-5"} text-primary-950`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"
          />
        </svg>
      </span>
      <span
        className={`font-display ${isSmall ? "text-base" : "text-xl"} font-medium ${textColor} tracking-tight`}
      >
        Estate
      </span>
    </span>
  );
}
