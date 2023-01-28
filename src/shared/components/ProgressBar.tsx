import React from "react";

export interface ProgressBarProps {
  progressPercentage: number;
}

const ProgressBar = ({ progressPercentage }: ProgressBarProps) => {
  return (
    <div className="h-1 w-full rounded-full bg-gray-300 transition-[width] duration-200 ease-in-out">
      <div
        style={{ width: `${progressPercentage}%` }}
        className="h-full rounded-full bg-black"
      ></div>
    </div>
  );
};

export default ProgressBar;
