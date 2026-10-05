import React, { useState } from 'react';
import { X, Sparkles, Building2, Check, FileText } from 'lucide-react';
import { QUOTATION_THEMES, ThemeCategory } from '../../types/theme';
import { ThemeThumbnail } from './themes/ThemeThumbnail';

export interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelectTheme: (themeId: string, setAsDefault?: boolean) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
}) => {
  const [activeCategory, setActiveCategory] = useState<ThemeCategory>('business');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentThemeId || 'modern');
  const [setAsDefault, setSetAsDefault] = useState<boolean>(false);

  if (!isOpen) return null;

  const businessThemes = QUOTATION_THEMES.filter((t) => t.category === 'business');
  const festiveThemes = QUOTATION_THEMES.filter((t) => t.category === 'festive');

  const displayedThemes = activeCategory === 'business' ? businessThemes : festiveThemes;
  const activeTheme = QUOTATION_THEMES.find((t) => t.id === selectedThemeId) || businessThemes[0];

  const handleApply = () => {
    onSelectTheme(selectedThemeId, setAsDefault);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
              <Sparkles className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Document Template & Theme Gallery
                <span className="text-[11px] font-normal text-slate-400">
                  ({QUOTATION_THEMES.length} Professional Layouts)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose a professional business document structure (A4 / A5) or festive presentation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCategory('business')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'business'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Professional Document Templates</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {businessThemes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveCategory('festive')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'festive'
                  ? 'bg-white text-amber-700 shadow-sm border border-amber-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span className="text-sm">🪔</span>
              <span>Festive Themes</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {festiveThemes.length} Seasonal
              </span>
            </button>
          </div>

          <span className="hidden sm:inline text-xs text-slate-500 italic">
            Instant live preview on template click
          </span>
        </div>

        {/* Theme Grid */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedThemes.map((t) => {
              const isSelected = t.id === selectedThemeId;
              const isA5 = t.paperSize === 'A5';

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedThemeId(t.id);
                    // Instant live preview by triggering onSelectTheme immediately
                    onSelectTheme(t.id, false);
                  }}
                  className={`group relative bg-white rounded-xl p-2.5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-red-600 ring-2 ring-red-500/20 shadow-md scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Miniature Visual Layout */}
                  <ThemeThumbnail theme={t} isSelected={isSelected} />

                  {/* Theme Info */}
                  <div className="pt-2 text-left">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-red-600 transition-colors truncate">
                        {t.name}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                            isA5 ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.paperSize}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                      {t.description}
                    </p>
                  </div>

                  {/* Active selection tick */}
                  {isSelected && (
                    <div className="mt-2 pt-1 border-t border-red-100 flex items-center justify-center gap-1 text-[10px] font-bold text-red-600">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Active Preview</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Active selection summary & Default toggle */}
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Selected:</span>
              <strong className="text-slate-900">{activeTheme.name}</strong>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded text-slate-700 font-bold">
                {activeTheme.paperSize}
              </span>
            </span>
            <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
              />
              <span>Set as default template for new quotations</span>
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              Close
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Apply & Save Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
