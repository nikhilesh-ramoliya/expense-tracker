"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/transactions", label: "Activity", icon: "activity" },
  { href: "/insights", label: "Insights", icon: "insights" },
  { href: "/budgets", label: "Budgets", icon: "budgets" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

type IconName = (typeof ITEMS)[number]["icon"];

function TabIcon({ name, filled }: { name: IconName; filled: boolean }) {
  const stroke = filled ? 0 : 1.7;
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;

  if (name === "home") {
    return (
      <svg {...common}>
        {filled ? (
          <path
            fill="currentColor"
            d="M11.3 3.3a1 1 0 0 1 1.4 0l8 8a1 1 0 0 1-1.4 1.4L19 12.4V19a2 2 0 0 1-2 2h-3.2v-5.2h-3.6V21H7a2 2 0 0 1-2-2v-6.6l-.3.3a1 1 0 0 1-1.4-1.4l8-8Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinejoin="round"
            d="M4.5 10.8 12 4.2l7.5 6.6V19a1.5 1.5 0 0 1-1.5 1.5h-3.7v-5.3H9.7v5.3H6A1.5 1.5 0 0 1 4.5 19Z"
          />
        )}
      </svg>
    );
  }

  if (name === "activity") {
    return (
      <svg {...common}>
        {filled ? (
          <path
            fill="currentColor"
            d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2.2 4.2A1 1 0 0 0 6 9.2v.1a1 1 0 0 0 1 1h8.8a1 1 0 1 0 0-2Zm0 4A1 1 0 0 0 6 13.2v.1a1 1 0 0 0 1 1h5.3a1 1 0 1 0 0-2Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            d="M6.5 5.5h11A2 2 0 0 1 19.5 7.5v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2ZM7.5 9.5h9M7.5 14h6"
          />
        )}
      </svg>
    );
  }

  if (name === "insights") {
    return (
      <svg {...common}>
        {filled ? (
          <path
            fill="currentColor"
            d="M5 19.2A1 1 0 0 1 4 18.2V9.8a1 1 0 0 1 2 0v8.4a1 1 0 0 1-1 1Zm5 0a1 1 0 0 1-1-1V5.8a1 1 0 0 1 2 0v12.4a1 1 0 0 1-1 1Zm5 0a1 1 0 0 1-1-1v-7.1a1 1 0 1 1 2 0v7.1a1 1 0 0 1-1 1Zm5 0a1 1 0 0 1-1-1V12a1 1 0 1 1 2 0v6.2a1 1 0 0 1-1 1Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            d="M6 18.5V10M11 18.5V6M16 18.5v-6.5M21 18.5V13"
          />
        )}
      </svg>
    );
  }

  if (name === "budgets") {
    return (
      <svg {...common}>
        {filled ? (
          <path
            fill="currentColor"
            d="M12 2.8a9.2 9.2 0 1 1 0 18.4 9.2 9.2 0 0 1 0-18.4Zm.1 3.4a1 1 0 0 0-1 1v.4c-.9.2-1.6.7-2.1 1.4a1 1 0 1 0 1.6 1.2c.2-.3.6-.5 1.2-.5h.5c.6 0 1 .3 1 .7s-.3.6-1.3.9l-.4.1c-1.4.4-2.3 1.2-2.3 2.5 0 1.1.7 1.9 1.8 2.2v.4a1 1 0 1 0 2 0v-.4c.8-.2 1.5-.6 2-1.3a1 1 0 0 0-1.6-1.2c-.3.3-.7.5-1.3.5h-.3c-.7 0-1.1-.2-1.1-.7 0-.3.2-.5 1.2-.8l.5-.2c1.4-.4 2.4-1.2 2.4-2.5 0-1.1-.8-1.9-1.9-2.2v-.4a1 1 0 0 0-1-1Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            d="M12 4.2a7.8 7.8 0 1 1 0 15.6 7.8 7.8 0 0 1 0-15.6Zm0 3.6v.6m0 7.2v.6m-1.8-6.3c.3-.5.9-.8 1.8-.8h.4c.9 0 1.5.5 1.5 1.2s-.7 1.1-1.9 1.5l-.4.1c-1.3.4-2.1 1-2.1 2.1 0 1 .7 1.7 1.8 2v.2m2.8-6.3c.2.3.3.6.3 1 0 1.1-1 1.7-2.3 2.1"
          />
        )}
      </svg>
    );
  }

  return (
    <svg {...common}>
      {filled ? (
        <path
          fill="currentColor"
          d="M10.1 2.8h3.8a1 1 0 0 1 1 .8l.3 1.5a7.4 7.4 0 0 1 1.5.9l1.4-.6a1 1 0 0 1 1.2.3l1.9 3.3a1 1 0 0 1-.2 1.3l-1.2 1c.1.4.1.8.1 1.2s0 .8-.1 1.2l1.2 1a1 1 0 0 1 .2 1.3l-1.9 3.3a1 1 0 0 1-1.2.3l-1.4-.6a7.4 7.4 0 0 1-1.5.9l-.3 1.5a1 1 0 0 1-1 .8h-3.8a1 1 0 0 1-1-.8l-.3-1.5a7.4 7.4 0 0 1-1.5-.9l-1.4.6a1 1 0 0 1-1.2-.3L2.7 15a1 1 0 0 1 .2-1.3l1.2-1A7 7 0 0 1 4 11.5c0-.4 0-.8.1-1.2l-1.2-1a1 1 0 0 1-.2-1.3l1.9-3.3a1 1 0 0 1 1.2-.3l1.4.6a7.4 7.4 0 0 1 1.5-.9l.3-1.5a1 1 0 0 1 1-.8ZM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinejoin="round"
          d="m10.2 4.2-.3 1.6-1.5.8-1.5-.6-1.7 3 1.2 1.1v1.8l-1.2 1.1 1.7 3 1.5-.6 1.5.8.3 1.6h3.6l.3-1.6 1.5-.8 1.5.6 1.7-3-1.2-1.1V10.1l1.2-1.1-1.7-3-1.5.6-1.5-.8-.3-1.6Zm1.8 5.4a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z"
        />
      )}
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav liquid-nav" aria-label="Primary">
      <div className="bottom-nav-items">
        {ITEMS.map((item) => {
          const current =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={current ? "nav-item nav-on" : "nav-item"}
              aria-current={current ? "page" : undefined}
            >
              <span className="nav-glyph">
                <TabIcon name={item.icon} filled={current} />
              </span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
