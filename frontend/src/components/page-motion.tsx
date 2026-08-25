interface PageMotionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageMotion({ children, className }: PageMotionProps) {
  return <div className={className}>{children}</div>;
}
