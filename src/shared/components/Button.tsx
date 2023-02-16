import type { ReactNode } from "react";

import classNames from "classnames";

export interface ButtonProps {
  children?: ReactNode;
  disabled?: boolean;
  width?: string;
  type?: "button" | "submit" | "reset" | undefined;
  color: "primary" | "secondary" | "lightGray" | "red";
  onClick?: () => void;
}

const Button = ({
  type,
  children,
  width,
  disabled,
  onClick,
  color,
}: ButtonProps) => {
  const handleClick = () => {
    if (disabled) {
      return;
    } else if (onClick) {
      onClick();
    }
  };
  return (
    <button
      type={type}
      onClick={() => handleClick()}
      className={classNames(
        { "w-full": width === "full" },
        { "bg-red-500": color === "red" },
        { "cursor-not-allowed bg-opacity-40 hover:bg-opacity-40": disabled },
        { "bg-zinc-200 text-black": color === "secondary" },
        { "bg-black text-white": color === "primary" },
        { "bg-zinc-100 text-black": color === "lightGray" },
        "cursor-pointer rounded-full px-4 py-2 outline-none hover:bg-opacity-80"
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
