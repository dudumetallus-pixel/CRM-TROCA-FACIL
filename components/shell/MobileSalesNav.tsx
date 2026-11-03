"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, ChartBar, ChatCircle, Kanban, Users } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Navegação operacional do CRM Troca Fácil para celular.
 * São links para telas REAIS do sistema, sem duplicar o inbox ou suas regras.
 * A navegação administrativa continua disponível na gaveta do cabeçalho.
 */
const destinos = [
  { href: "/app/inbox", label: "Conversas", icon: ChatCircle },
  { href: "/app/kanban", label: "Funil", icon: Kanban },
  { href: "/app/contacts", label: "Clientes", icon: Users },
  { href: "/app/tasks", label: "Retornos", icon: CalendarBlank },
  { href: "/app/metrics", label: "Metas", icon: ChartBar },
] as const;

export function MobileSalesNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação comercial"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
    >
      <div className="grid h-16 grid-cols-5 items-stretch pb-[env(safe-area-inset-bottom)]">
        {destinos.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[10px] font-semibold transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring",
                ativo ? "text-accent" : "text-text-muted hover:text-foreground",
              )}
            >
              <Icon size={21} weight={ativo ? "fill" : "regular"} aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
