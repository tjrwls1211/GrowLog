import React from "react";
import Image from "next/image";

type Props = {
  className?: string;
  src?: string;
  size?: number; 
  hideIcon?: boolean;
};

export default function Logo({ className = "", src, size = 22, hideIcon = false }: Props) {
  return (
    <div className={["flex items-center gap-2", className].join(" ")}> 
      {!hideIcon && (
        src ? (
          <Image
            src={src}
            alt="GrowLog Icon"
            width={size}
            height={size}
            priority
          />
        ) : (
          <span aria-hidden style={{ fontSize: size, lineHeight: 1 }}>
            🌱
          </span>
        )
      )}
      <span className="font-semibold tracking-[-0.02em] text-[18px]">GrowLog</span>
    </div>
  );
}
