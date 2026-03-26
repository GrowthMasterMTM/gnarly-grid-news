interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className = "h-8 w-8" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M256 96L400 384H112L256 96Z"
        stroke="#3B82F6"
        strokeWidth="28"
        fill="none"
        strokeLinejoin="bevel"
      />
      <line
        x1="144"
        y1="320"
        x2="368"
        y2="320"
        stroke="#3B82F6"
        strokeWidth="8"
        opacity="0.5"
      />
      <line
        x1="176"
        y1="256"
        x2="336"
        y2="256"
        stroke="#3B82F6"
        strokeWidth="8"
        opacity="0.35"
      />
      <rect x="244" y="82" width="24" height="24" fill="#3B82F6" />
    </svg>
  );
}
