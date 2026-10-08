import { ReactNode } from 'react';

type BadgeVariant = 'normal' | 'warning' | 'suspicious' | 'critical' | 'informational' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  normal: 'bg-normal-50 text-normal-700 border-normal-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  suspicious: 'bg-suspicious-50 text-suspicious-700 border-suspicious-200',
  critical: 'bg-critical-50 text-critical-700 border-critical-200',
  informational: 'bg-informational-50 text-informational-700 border-informational-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
