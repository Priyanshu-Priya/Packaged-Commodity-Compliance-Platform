import React from 'react';
import { ComplianceStatus } from '../types';

interface StatusBadgeProps {
  status?: ComplianceStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'NOT_APPLICABLE', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-1 gap-1.5',
    lg: 'text-[12px] px-3 py-1.5 gap-1.5',
  };

  const base = `inline-flex items-center rounded-full border font-medium tracking-wide ${sizeClasses[size]}`;

  switch (status) {
    case 'PASS':
      return (
        <span className={`${base} bg-success-bg text-success border-success-border`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>COMPLIANT</span>
        </span>
      );
    case 'FAIL':
      return (
        <span className={`${base} bg-danger-bg text-danger border-danger-border`}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
          <span>NON-COMPLIANT</span>
        </span>
      );
    case 'REVIEW_REQUIRED':
      return (
        <span className={`${base} bg-warning-bg text-warning border-warning-border`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          <span>REVIEW REQUIRED</span>
        </span>
      );
    case 'NOT_APPLICABLE':
    default:
      return (
        <span className={`${base} bg-surface-subtle text-ink-secondary border-border`}>
          <span className="w-1.5 h-1.5 rounded-full bg-ink-tertiary" />
          <span>NOT APPLICABLE</span>
        </span>
      );
  }
};
