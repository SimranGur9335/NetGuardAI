import { Severity } from '../../types';
import { Badge } from './Badge';

interface SeverityBadgeProps {
  severity: Severity;
}

const severityVariant: Record<Severity, 'critical' | 'warning' | 'suspicious' | 'neutral'> = {
  [Severity.CRITICAL]: 'critical',
  [Severity.HIGH]: 'warning',
  [Severity.MEDIUM]: 'suspicious',
  [Severity.LOW]: 'neutral',
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return <Badge variant={severityVariant[severity]}>{severity}</Badge>;
}
