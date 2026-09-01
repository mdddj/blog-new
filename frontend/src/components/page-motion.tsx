interface PageMotionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageMotion({ children, className }: PageMotionProps) {
  return (
    <div data-page-motion className={className}>
      {children}
    </div>
  );
}
