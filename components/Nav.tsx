"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", emoji: "📚", label: "Stories" },
  { href: "/stickers", emoji: "🌟", label: "Stickers" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b-4 border-amber-200">
      <ul className="flex justify-center gap-2 sm:gap-4 py-2 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-4 py-2 min-w-[76px] min-h-[64px] justify-center transition-transform active:scale-95 ${
                  isActive ? "bg-amber-300 shadow-inner" : "bg-amber-50 hover:bg-amber-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="text-3xl leading-none" aria-hidden>
                  {item.emoji}
                </span>
                <span className="text-xs font-semibold text-purple-900">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
