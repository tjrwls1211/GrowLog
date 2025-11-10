import React from "react";

type TagProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: React.ReactNode;
};

export default function Tag({ className = "", children, ...props }: TagProps) {
  return (
    <span
      className={[
        "tag inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}

