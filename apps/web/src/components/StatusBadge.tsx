import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { ComplianceStatus } from '../types';

interface StatusBadgeProps {
  status?: ComplianceStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'NOT_APPLICABLE', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-semibold',
  };

  switch (status) {
    case 'PASS':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses[size]}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>PASS</span>
        </span>
      );
    case 'FAIL':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses[size]}`}>
          <XCircle className="w-3.5 h-3.5" />
          <span>NON-COMPLIANT</span>
        </span>
      );
    case 'REVIEW_REQUIRED':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses[size]}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>REVIEW REQUIRED</span>
        </span>
      );
    case 'NOT_APPLICABLE':
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30 ${sizeClasses[size]}`}>
          <MinusCircle className="w-3.5 h-3.5" />
          <span>NOT APPLICABLE</span>
        </span>
      );
  }
};
