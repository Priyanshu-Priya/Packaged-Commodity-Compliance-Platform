import React from 'react';
import { ProductFacts, FactValue } from '../../types';
import { Tag, Calendar, MapPin, Phone, Globe, Scale, DollarSign, CheckCircle2, XCircle } from 'lucide-react';

interface FactsSheetProps {
  facts: ProductFacts;
}

export const FactsSheet: React.FC<FactsSheetProps> = ({ facts }) => {
  const renderFactCard = (
    title: string,
    fact?: FactValue,
    icon?: React.ReactNode,
    extraInfo?: string
  ) => {
    const isPresent = !!fact?.raw_value || !!fact?.normalized_value;

    return (
      <div className={`p-4 rounded-xl border transition-all ${
        isPresent
          ? 'bg-gov-850/80 border-slate-700/80 hover:border-gold-500/40'
          : 'bg-gov-900/40 border-slate-800/60 opacity-75'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {icon}
            <span>{title}</span>
          </div>
          {isPresent ? (
            <span className="flex items-center space-x-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>{(fact!.confidence * 100).toFixed(0)}%</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              <XCircle className="w-3 h-3" />
              <span>Missing</span>
            </span>
          )}
        </div>

        <div className="mt-2.5">
          {isPresent ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-white break-words">
                {typeof fact!.normalized_value === 'object' && fact!.normalized_value !== null
                  ? JSON.stringify(fact!.normalized_value)
                  : String(fact!.normalized_value ?? fact!.raw_value)}
              </p>
              {fact!.raw_value && fact!.raw_value !== String(fact!.normalized_value) && (
                <p className="text-[11px] text-slate-400 font-mono">
                  Raw: &ldquo;{fact!.raw_value}&rdquo;
                </p>
              )}
              {extraInfo && (
                <p className="text-[11px] text-gold-400/90 font-medium">{extraInfo}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No declaration detected in scan</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white">Structured Declarations Fact Sheet</h2>
          <p className="text-xs text-slate-400">
            Normalized statutory attributes extracted from OCR tokens under Legal Metrology Rules, 2011.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-gov-800 text-gold-400 border border-gold-500/20 font-mono">
          Rule 6 Fact Matrix
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Maximum Retail Price (MRP) */}
        {renderFactCard(
          'Rule 6(1)(e) - MRP',
          facts.mrp_value,
          <DollarSign className="w-4 h-4 text-emerald-400" />,
          facts.inclusive_of_taxes_clause
            ? '✓ Inclusive of all taxes confirmed'
            : '⚠️ Tax inclusion clause missing'
        )}

        {/* Net Quantity & Units */}
        {renderFactCard(
          'Rule 6(1)(c) - Net Quantity',
          facts.net_quantity_value,
          <Scale className="w-4 h-4 text-sky-400" />,
          facts.net_quantity_unit?.raw_value
            ? `Declared Unit: ${facts.net_quantity_unit.raw_value} (Normalized: ${facts.net_quantity_value?.normalized_value} ${facts.net_quantity_unit?.normalized_value})`
            : undefined
        )}

        {/* Unit Sale Price (USP) */}
        {renderFactCard(
          'Rule 6(1)(da) - Unit Sale Price',
          facts.unit_sale_price,
          <Tag className="w-4 h-4 text-amber-400" />
        )}

        {/* Generic or Common Name */}
        {renderFactCard(
          'Rule 6(1)(b) - Generic Name',
          facts.generic_name,
          <Tag className="w-4 h-4 text-purple-400" />
        )}

        {/* Dates */}
        {renderFactCard(
          'Rule 6(1)(d) - Mfg / Pkd Date',
          facts.mfg_date,
          <Calendar className="w-4 h-4 text-blue-400" />,
          facts.best_before?.raw_value ? facts.best_before.raw_value : undefined
        )}

        {/* Country of Origin */}
        {renderFactCard(
          'Rule 6(1)(a) - Country of Origin',
          facts.country_of_origin,
          <Globe className="w-4 h-4 text-teal-400" />
        )}

        {/* Manufacturer Name */}
        {renderFactCard(
          'Rule 6(1)(a) - Manufacturer / Packer',
          facts.manufacturer_name,
          <MapPin className="w-4 h-4 text-rose-400" />
        )}

        {/* Manufacturer Address */}
        {renderFactCard(
          'Rule 6(1)(a) - Address & Pincode',
          facts.manufacturer_address,
          <MapPin className="w-4 h-4 text-rose-400" />
        )}

        {/* Consumer Care Contacts */}
        {renderFactCard(
          'Rule 6(1)(n) - Consumer Care',
          facts.consumer_care_phone || facts.consumer_care_email,
          <Phone className="w-4 h-4 text-indigo-400" />,
          [
            facts.consumer_care_phone?.normalized_value ? `Tel: ${facts.consumer_care_phone.normalized_value}` : null,
            facts.consumer_care_email?.normalized_value ? `Email: ${facts.consumer_care_email.normalized_value}` : null,
          ].filter(Boolean).join(' • ')
        )}
      </div>
    </div>
  );
};
