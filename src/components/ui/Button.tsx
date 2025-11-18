"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const base = "btn inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-[15px]",
    lg: "h-12 px-5 text-base",
  } as const;

  const variants = {
    primary: "btn-primary hover:brightness-95",
    outline: "btn-outline hover:bg-black/5",
    ghost: "hover:bg-black/5",
  } as const;

  return (
    <button
      className={[base, sizes[size], variants[variant], className].join(" ")}
      {...props}
    />
  );
}

