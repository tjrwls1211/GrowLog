import React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
};

export default function Card({ className = "", as: Component = "div", ...props }: CardProps) {
  return <Component className={["card p-5", className].join(" ")} {...props} />;
}

