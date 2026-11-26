import type { ReactNode } from "react";

export default function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`mo-card rounded-[22px] p-5 sm:p-6 ${className}`}
      style={{
        backgroundColor: "var(--mo-card)",
        borderColor: "var(--mo-border-glass)",
        boxShadow: "var(--mo-shadow)",
      }}
    >
      {children}
    </section>
  );
}
