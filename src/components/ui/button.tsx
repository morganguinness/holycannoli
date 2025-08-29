import * as React from 'react';

export function Button({ className = '', children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={
        `px-4 py-2 rounded-lg bg-orange-500 text-white hover:brightness-110 active:scale-95 transition ${className}`
      }
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
