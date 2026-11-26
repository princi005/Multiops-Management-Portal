import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border border-violet-700 bg-violet-700 text-white shadow-md shadow-violet-900/15 hover:border-violet-800 hover:bg-violet-800",
  secondary: "border border-slate-200 bg-white/80 text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10",
  ghost: "border border-transparent text-slate-600 hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-white/5",
  danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/20",
};

export default function AppButton({
  variant = "secondary",
  className = "",
  type = "button",
  ...props
}: AppButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
