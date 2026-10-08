import { ThreatCategory } from '../../types';
import { Badge } from './Badge';

interface CategoryBadgeProps {
  category: ThreatCategory;
}

const categoryVariant: Record<ThreatCategory, 'normal' | 'critical' | 'warning' | 'suspicious'> = {
  [ThreatCategory.NORMAL]: 'normal',
  [ThreatCategory.DOS_DDOS]: 'critical',
  [ThreatCategory.BRUTE_FORCE]: 'warning',
  [ThreatCategory.PORT_SCAN]: 'suspicious',
};

const categoryLabel: Record<ThreatCategory, string> = {
  [ThreatCategory.NORMAL]: 'Normal',
  [ThreatCategory.DOS_DDOS]: 'DoS/DDoS',
  [ThreatCategory.BRUTE_FORCE]: 'Brute Force',
  [ThreatCategory.PORT_SCAN]: 'Port Scan',
};

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return <Badge variant={categoryVariant[category]}>{categoryLabel[category]}</Badge>;
}
