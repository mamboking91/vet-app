"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge'; // Importamos Badge
import { cn } from '@/lib/utils'; // Importamos cn

interface NavLinkProps {
  href: string;
  isDisabled?: boolean;
  badgeCount?: number;
  children: React.ReactNode;
}

export default function NavLink({ href, isDisabled, badgeCount, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href) && !isDisabled);

  return (
    <Link
      href={isDisabled ? "#" : href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
      aria-disabled={isDisabled}
      onClick={(e) => { if (isDisabled) e.preventDefault(); }}
    >
      {children}
      {badgeCount && badgeCount > 0 && (
        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          {badgeCount}
        </Badge>
      )}
    </Link>
  );
}