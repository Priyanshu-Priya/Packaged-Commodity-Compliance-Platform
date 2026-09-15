import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LegalRuleSet } from '../types';

export const RulesView: React.FC = () => {
  const [ruleset, setRuleset] = useState<LegalRuleSet | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRules() {
      try {
        const data = await api.getRules();
        setRuleset(data);
      } catch (err) {
        console.error('Failed to load rules:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRules();
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Statutory Rules' },
    { id: 'MANDATORY_DECLARATION', label: 'Rule 6 Mandatory' },
    { id: 'QUANTITY', label: 'Net Quantity' },
    { id: 'MRP', label: 'Pricing & USP' },
    { id: 'FONT_SIZE', label: 'Numeral Height' },
    { id: 'LEGIBILITY', label: 'Legibility' },
    { id: 'EXEMPTION', label: 'Exemptions' },
  ];

  const filteredRules = ruleset?.rules.filter((r) => selectedCategory === 'ALL' ? true : r.category === selectedCategory) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">Legal Metrology (Packaged Commodities) Rules, 2011</h2>
          <p className="text-[12px] text-ink-secondary mt-1">Authoritative statutory rule registry enforced by the compliance verification engine.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-border text-[11px]">
          <span className="text-ink-tertiary">Ruleset</span>
          <span className="font-mono font-medium text-ink">{ruleset?.ruleset_version || 'Loading…'}</span>
          <span className="w-px h-3 bg-border" />
          <span className="text-ink-tertiary">{ruleset?.rules.length || 0} rules</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-surface-subtle border border-border-subtle w-fit">
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${selectedCategory === cat.id ? 'bg-surface border border-border shadow-soft text-ink' : 'text-ink-secondary hover:text-ink'}`}>{cat.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-[12px] text-ink-tertiary bg-surface border border-border rounded-xl">Loading statutory rule definitions…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => (
            <div key={rule.rule_id} className="bg-surface border border-border rounded-xl p-4 shadow-soft hover:shadow-soft-md hover:border-border-strong transition-all flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[10px] font-mono font-medium text-ink">{rule.source_rule}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${rule.severity === 'HIGH' ? 'bg-danger-bg text-danger border-danger-border' : 'bg-warning-bg text-warning border-warning-border'}`}>{rule.severity}</span>
              </div>
              <h3 className="text-[13px] font-semibold text-ink leading-tight">{rule.title}</h3>
              <p className="text-[11px] text-ink-secondary leading-relaxed mt-2 flex-1">{rule.description}</p>
              <div className="pt-3 mt-3 border-t border-border-subtle flex items-center justify-between text-[10px] text-ink-tertiary">
                <span>Type: <strong className="text-ink-secondary font-medium">{rule.verification_type}</strong></span>
                <span className="font-mono">{rule.rule_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-canvas border border-border-subtle rounded-xl p-3 text-[11px] text-ink-secondary leading-relaxed">
        <span className="font-medium text-ink">Statutory Notice:</span> This registry mirrors the official Legal Metrology (Packaged Commodities) Rules, 2011 as amended. Rule evaluation is deterministic and auditable – no AI decides compliance.
      </div>
    </div>
  );
};
