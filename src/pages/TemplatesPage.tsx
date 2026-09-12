import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Star,
  FileText,
} from 'lucide-react';
import { storage } from '../services/storage';
import { TermsTemplate } from '../types';
import { useToast } from '../context/ToastContext';

export const TemplatesPage: React.FC = () => {
  const { success, error } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TermsTemplate | null>(null);

  const [title, setTitle] = useState('');
  const [terms, setTerms] = useState<string[]>(['']);
  const [isDefault, setIsDefault] = useState(false);

  const templates = useMemo(() => storage.getTermsTemplates(), [refreshKey]);

  const openAddModal = () => {
    setEditingTemplate(null);
    setTitle('');
    setTerms([
      'PRICE BASIS: Ex-works Taloja Godown, Navi Mumbai.',
      'TAXES & DUTIES: GST as applicable at prevailing government rates.',
      'DELIVERY: Ready stock subject to prior sale.',
      'TEST CERTIFICATE: MTC will be provided according to EN 10204 Type 3.1.',
      'PAYMENT TERMS: 100% against Proforma Invoice prior to dispatch.',
      'VALIDITY: 15 days from date of quotation.',
    ]);
    setIsDefault(false);
    setIsModalOpen(true);
  };

  const openEditModal = (t: TermsTemplate) => {
    setEditingTemplate(t);
    setTitle(t.title);
    setTerms([...t.terms]);
    setIsDefault(t.isDefault);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('Validation Error', 'Template title is required');
      return;
    }

    const filteredTerms = terms.map((t) => t.trim()).filter(Boolean);
    if (filteredTerms.length === 0) {
      error('Validation Error', 'At least one term bullet point is required');
      return;
    }

    storage.saveTermsTemplate({
      ...(editingTemplate ? { id: editingTemplate.id } : {}),
      title,
      terms: filteredTerms,
      isDefault,
    });

    success(
      editingTemplate ? 'Template Updated' : 'Template Created',
      `"${title}" saved successfully`
    );
    setIsModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Terms & Conditions Templates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Predefined commercial clauses for high nickel alloys, stainless steel, and project supplies.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Terms Template</span>
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-soft hover:shadow-card transition-all flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{tmpl.title}</h3>
                    {tmpl.isDefault && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Default
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    {tmpl.terms.length} Commercial clauses
                  </span>
                </div>

                <button
                  onClick={() => openEditModal(tmpl)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Edit Template"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Clause preview list */}
              <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-600">
                {tmpl.terms.slice(0, 5).map((term, i) => (
                  <li key={i} className="line-clamp-2">
                    {term}
                  </li>
                ))}
                {tmpl.terms.length > 5 && (
                  <li className="text-slate-400 italic list-none pt-1">
                    +{tmpl.terms.length - 5} more clauses...
                  </li>
                )}
              </ol>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => openEditModal(tmpl)}
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                View & Edit Clauses →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingTemplate ? 'Edit Terms Template' : 'New Terms Template'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Template Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High-Pressure Boiler Tubing Terms"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">Clauses & Conditions</label>
                  <button
                    type="button"
                    onClick={() => setTerms([...terms, ''])}
                    className="text-red-600 hover:text-red-700 font-bold"
                  >
                    + Add Clause
                  </button>
                </div>

                <div className="space-y-2">
                  {terms.map((t, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 w-5 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={t}
                        onChange={(e) => {
                          const next = [...terms];
                          next[idx] = e.target.value;
                          setTerms(next);
                        }}
                        placeholder="Enter commercial clause text..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:bg-white focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setTerms(terms.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="defaultTmpl"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <label htmlFor="defaultTmpl" className="font-semibold text-slate-700 cursor-pointer">
                  Set as Default Template for New Quotations
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-600/20"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
