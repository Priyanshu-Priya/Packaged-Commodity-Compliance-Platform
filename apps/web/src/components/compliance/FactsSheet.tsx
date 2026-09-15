import React from 'react';
import { ProductFacts, FactValue } from '../../types';

interface FactsSheetProps {
  facts: ProductFacts;
}

export const FactsSheet: React.FC<FactsSheetProps> = ({ facts }) => {
  const renderFactCard = (title: string, fact?: FactValue, extraInfo?: string) => {
    const isPresent = !!fact?.raw_value || !!fact?.normalized_value;
    return (
      <div className={`p-4 rounded-xl border bg-surface shadow-soft transition-colors ${isPresent ? 'border-border hover:border-border-strong' : 'border-border-subtle bg-surface-subtle/50 opacity-80'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-tertiary">{title}</div>
          {isPresent ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-success-bg border border-success-border text-success">
              {(fact!.confidence * 100).toFixed(0)}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-danger-bg border border-danger-border text-danger">Missing</span>
          )}
        </div>
        <div className="mt-2.5">
          {isPresent ? (
            <div className="space-y-1">
              <div className="text-[13px] font-medium text-ink break-words leading-relaxed">
                {typeof fact!.normalized_value === 'object' && fact!.normalized_value !== null
                  ? JSON.stringify(fact!.normalized_value)
                  : String(fact!.normalized_value ?? fact!.raw_value)}
              </div>
              {fact!.raw_value && fact!.raw_value !== String(fact!.normalized_value) && (
                <div className="text-[11px] font-mono text-ink-tertiary">Raw: "{fact!.raw_value}"</div>
              )}
              {extraInfo && <div className="text-[11px] text-ink-secondary mt-1">{extraInfo}</div>}
            </div>
          ) : (
            <div className="text-[11px] text-ink-tertiary italic">No declaration detected in scan</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div>
          <div className="text-[13px] font-semibold text-ink">Extracted Product Information</div>
          <div className="text-[11px] text-ink-tertiary mt-0.5">Normalized statutory attributes from OCR tokens • Rule 6 Fact Matrix</div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-surface border border-border text-ink-tertiary font-mono">OCR → Facts → Verification</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {renderFactCard('Rule 6(1)(e) — MRP', facts.mrp_value, facts.inclusive_of_taxes_clause ? '✓ Inclusive of all taxes confirmed' : '⚠ Tax clause missing')}
        {renderFactCard('Rule 6(1)(c) — Net Quantity', facts.net_quantity_value, facts.net_quantity_unit?.raw_value ? `Unit: ${facts.net_quantity_unit.raw_value} • Normalized: ${facts.net_quantity_value?.normalized_value} ${facts.net_quantity_unit?.normalized_value}` : undefined)}
        {renderFactCard('Rule 6(1)(da) — Unit Sale Price', facts.unit_sale_price)}
        {renderFactCard('Rule 6(1)(b) — Generic Name', facts.generic_name)}
        {renderFactCard('Rule 6(1)(d) — Mfg / Pkd Date', facts.mfg_date, facts.best_before?.raw_value ? facts.best_before.raw_value : undefined)}
        {renderFactCard('Rule 6(1)(a) — Country of Origin', facts.country_of_origin)}
        {renderFactCard('Rule 6(1)(a) — Manufacturer / Packer', facts.manufacturer_name)}
        {renderFactCard('Rule 6(1)(a) — Address & Pincode', facts.manufacturer_address)}
        {renderFactCard('Rule 6(1)(n) — Consumer Care', facts.consumer_care_phone || facts.consumer_care_email, [
          facts.consumer_care_phone?.normalized_value ? `Tel: ${facts.consumer_care_phone.normalized_value}` : null,
          facts.consumer_care_email?.normalized_value ? `Email: ${facts.consumer_care_email.normalized_value}` : null,
        ].filter(Boolean).join(' • '))}
      </div>

      <div className="bg-surface-subtle border border-border-subtle rounded-xl p-3 text-[11px] text-ink-secondary leading-relaxed">
        <span className="font-medium text-ink">AI Transparency:</span> Each field shows extraction confidence from OCR and regex. Source regions are preserved as bounding boxes for evidence. No confidence values are invented – all come from the perception pipeline.
      </div>
    </div>
  );
};
