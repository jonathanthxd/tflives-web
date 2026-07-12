"use client";

import { useEffect, useState } from "react";

interface SafeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function SafeButton({ children, ...props }: SafeButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button {...props} disabled style={{ visibility: "hidden" }}>
        {children}
      </button>
    );
  }

  return <button {...props}>{children}</button>;
}