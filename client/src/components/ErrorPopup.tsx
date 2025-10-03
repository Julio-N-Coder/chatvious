import React from "react";

export default function ErrorPopup({
  message,
  className,
  hidden,
}: {
  message: string;
  className?: string;
  hidden?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`alert alert-error ${className} ${hidden ? "hidden" : ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="max-w-128 break-words text-lg font-bold">{message}</span>
    </div>
  );
}
