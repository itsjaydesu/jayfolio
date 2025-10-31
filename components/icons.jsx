export function CalendarIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" ry="2" />
      <path d="M3 10h18" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function DotfieldIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", "dotfield-icon-animated", className]
        .filter(Boolean)
        .join(" ")}
      fill="currentColor"
    >
      {/* Create 3 dots in a horizontal line with wave animation */}
      {[0, 1, 2].map((index) => {
        const x = 6 + index * 6; // Position dots at x = 6, 12, 18
        const y = 12; // Center vertically
        const delay = index * 1.5; // Stagger the animation for wave effect

        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            className="dotfield-dot"
            style={{
              animationDelay: `${delay}s`,
            }}
          >
            <animate
              attributeName="r"
              values="2;3.5;2"
              dur="12s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;1;0.4"
              dur="12s"
              begin={`${delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
    </svg>
  );
}

export function HamburgerIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
    >
      <line x1="5" y1="6" x2="19" y2="6" vectorEffect="non-scaling-stroke" />
      <line x1="5" y1="12" x2="19" y2="12" vectorEffect="non-scaling-stroke" />
      <line x1="5" y1="18" x2="19" y2="18" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function XLogoIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3.13 3h4.74l4.25 5.91 4.9-5.9h3.85l-6.98 8.43L20.87 21h-4.74l-4.53-6.25L6.6 21H2.74l7.2-8.69L3.13 3Z" />
    </svg>
  );
}

export function InstagramIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.25" cy="6.75" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YouTubeIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.75 7.5c.3-1.79 1.46-2.97 3.24-3.2C8.77 4 12 4 12 4s3.23 0 5.01.3c1.78.23 2.94 1.41 3.24 3.2.32 1.93.32 5.95 0 7.88-.3 1.79-1.46 2.97-3.24 3.2C15.23 18 12 18 12 18s-3.23 0-5.01-.3c-1.78-.23-2.94-1.41-3.24-3.2-.32-1.93-.32-5.95 0-7.88Z" />
      <path d="m10 15 5-3-5-3v6Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TagIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13.41 10.59 4H4v6.59L13.41 20 20 13.41z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

export function ArrowUpRightIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function BlueprintIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <path d="M12 4v16" />
      <path d="M4 12h16" />
    </svg>
  );
}

export function NotebookIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h3" />
    </svg>
  );
}

export function WaveformIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 15v-6" />
      <path d="M9 18V6" />
      <path d="M15 18V6" />
      <path d="M19 15v-6" />
    </svg>
  );
}

export function ChevronDoubleLeftIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}

export function ChevronDoubleRightIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m13 17 5-5-5-5" />
      <path d="m6 17 5-5-5-5" />
    </svg>
  );
}

export function ChevronDoubleUpIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 16 5-5 5 5" />
      <path d="m7 10 5-5 5 5" />
    </svg>
  );
}

export function ChevronDoubleDownIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 8 5 5 5-5" />
      <path d="m7 14 5 5 5-5" />
    </svg>
  );
}

export function UndoIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.36 2.36L3 7" />
    </svg>
  );
}

export function RedoIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7v6h-6" />
      <path d="M21 13a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.36 2.36L21 7" />
    </svg>
  );
}

export function SnapshotIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function RestoreIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8v4l2.5 2.5" />
      <path d="M20.04 11a8 8 0 1 0-14.9 3" />
      <path d="M5 11H1v4" />
      <path d="M22.54 15a8 8 0 0 1-14.9 3" />
    </svg>
  );
}

export function BoldIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 5h7a3 3 0 0 1 0 6H7z" />
      <path d="M7 11h8a3 3 0 0 1 0 6H7z" />
    </svg>
  );
}

export function ItalicIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="5" x2="10" y2="5" />
      <line x1="14" y1="19" x2="5" y2="19" />
      <line x1="15" y1="5" x2="9" y2="19" />
    </svg>
  );
}

export function UnderlineIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 5v6a5 5 0 0 0 10 0V5" />
      <line x1="5" y1="19" x2="19" y2="19" />
    </svg>
  );
}

export function StrikethroughIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 7a4 4 0 0 0-8 0c0 3 4 3 4 6" />
      <path d="M12 17c-1.3 0-2.4-.4-3.2-1.2" />
      <path d="M5 12h14" />
      <path d="M12 17c1.3 0 2.4-.4 3.2-1.2" />
    </svg>
  );
}

export function CodeIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </svg>
  );
}

export function QuoteIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 11a4 4 0 1 1 4 4v4" />
      <path d="M15 11a4 4 0 1 1 4 4v4" />
    </svg>
  );
}

export function DividerIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <path d="M12 6v2" />
      <path d="M12 16v2" />
    </svg>
  );
}

export function AlignLeftIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 6H3" />
      <path d="M15 12H3" />
      <path d="M17 18H3" />
    </svg>
  );
}

export function AlignCenterIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 6H3" />
      <path d="M17 12H7" />
      <path d="M19 18H5" />
    </svg>
  );
}

export function AlignRightIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 6H3" />
      <path d="M21 12H9" />
      <path d="M21 18H5" />
    </svg>
  );
}

export function AlignJustifyIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
}

export function ListIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

export function ListOrderedIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h2" />
      <path d="M4 6v4" />
      <path d="m4 14 1 1H3" />
      <path d="M4 19h1" />
    </svg>
  );
}

export function IndentIncreaseIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7H11" />
      <path d="M21 12H11" />
      <path d="M21 17h-10" />
      <path d="M4 8l4 4-4 4V8z" />
    </svg>
  );
}

export function IndentDecreaseIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 7H11" />
      <path d="M21 12h-10" />
      <path d="M21 17H11" />
      <path d="M8 8v8l-4-4 4-4z" />
    </svg>
  );
}

export function TableIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M10 10v9" />
      <path d="M14 10v9" />
    </svg>
  );
}

export function TableColumnIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="9" y1="5" x2="9" y2="19" />
      <line x1="15" y1="5" x2="15" y2="19" />
      <path d="m21 12 2 2-2 2" />
      <path d="m3 16-2-2 2-2" />
    </svg>
  );
}

export function TableRowIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="11" x2="21" y2="11" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <path d="m12 5 2-2 2 2" />
      <path d="m12 19 2 2 2-2" />
    </svg>
  );
}

export function TrashIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h18" />
      <path d="M8 7v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function UploadIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M7 9l5-5 5 5" />
      <path d="M12 4v12" />
    </svg>
  );
}

export function ExpandIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M21 3 14 10" />
      <path d="M9 21H3v-6" />
      <path d="m3 21 7-7" />
    </svg>
  );
}

export function CollapseIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={["icon", className].filter(Boolean).join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3H3v6" />
      <path d="M3 3 10 10" />
      <path d="M15 21h6v-6" />
      <path d="m21 21-7-7" />
    </svg>
  );
}
