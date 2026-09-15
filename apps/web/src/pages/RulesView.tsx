import React, { useEffect, useState } from 'react';
import { BookOpen, FileCode } from 'lucide-react';
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
    { id: 'MANDATORY_DECLARATION', label: 'Rule 6 Mandatory Declarations' },
    { id: 'QUANTITY', label: 'Net Quantity (Rule 6c, 11, 13)' },
    { id: 'MRP', label: 'Pricing & USP (Rule 6e, 6da)' },
    { id: 'FONT_SIZE', label: 'Numeral Height (Rule 7)' },
    { id: 'LEGIBILITY', label: 'Legibility & Manner (Rule 8, 9)' },
    { id: 'EXEMPTION', label: 'Statutory Exemptions (Rule 26)' },
  ];

  const filteredRules = ruleset?.rules.filter((r) =>
    selectedCategory === 'ALL' ? true : r.category === selectedCategory
  ) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-gold-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Legal Metrology (Packaged Commodities) Rules, 2011
            </h1>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Authoritative statutory rule registry enforced by the compliance verification engine.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-gov-850 px-3 py-1.5 rounded-lg border border-gold-500/20 text-xs">
          <span className="text-slate-400">Ruleset Version:</span>
          <span className="font-mono text-gold-400 font-bold">{ruleset?.ruleset_version || 'Loading...'}</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-gold-500 text-slate-950 shadow-md font-bold'
                : 'bg-gov-800 text-slate-300 hover:bg-gov-700 hover:text-white border border-slate-700/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rules Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading statutory rule definitions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRules.map((rule) => (
            <div
              key={rule.rule_id}
              className="glass-panel rounded-xl p-5 border border-slate-700/70 hover:border-gold-500/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 text-xs font-mono font-bold border border-gold-500/20">
                    {rule.source_rule}
                  </span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    rule.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {rule.severity} Severity
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">{rule.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{rule.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <FileCode className="w-3.5 h-3.5 text-sky-400" />
                  <span>Type: <strong className="text-slate-300">{rule.verification_type}</strong></span>
                </span>
                <span className="font-mono text-slate-400">{rule.rule_id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
