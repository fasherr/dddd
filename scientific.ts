import React from 'react';
import { ShieldCheck, Cpu, Sparkles, ArrowRightLeft, ChevronDown, ChevronUp, Layers, Grid, Globe } from 'lucide-react';
import { FORMATS } from '../converters';
import { useLanguage, Language } from '../i18n';

interface HeaderProps {
  activeTab: 'converter' | 'format-detail';
  onNavigateToConverter: () => void;
  queueCount: number;
  currentFormatId?: string;
  onOpenFormatPage: (formatId: string, preselectedTarget?: string) => void;
  onToggleMegaMenu: () => void;
  isMegaMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onNavigateToConverter,
  queueCount,
  currentFormatId,
  onOpenFormatPage,
  onToggleMegaMenu,
  isMegaMenuOpen,
}) => {
  const { t, lang, setLang } = useLanguage();

  return (
    <header className="border-b border-stone-200 bg-stone-50/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToConverter}
              className="w-10 h-10 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center font-bold shadow-xs hover:bg-stone-800 transition-colors cursor-pointer flex-shrink-0"
              title={t('back')}
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  onClick={onNavigateToConverter}
                  className="text-xl font-bold text-stone-900 tracking-tight cursor-pointer hover:text-stone-700 transition-colors"
                >
                  {t('title')}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold tracking-tight">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t('privacy')}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium">
                {t('subtitle')}
              </p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* Language Switcher */}
            <div className="relative flex items-center bg-white border border-stone-200 rounded-xl px-2 py-1.5 shadow-sm">
              <Globe className="w-4 h-4 text-stone-500 mr-1.5 ml-1" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="bg-transparent text-xs font-semibold text-stone-700 focus:outline-none cursor-pointer appearance-none pr-3"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </div>
            </div>

            {/* Mega-menu dropdown trigger */}
            <button
              type="button"
              id="mega-menu-trigger-btn"
              onClick={onToggleMegaMenu}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
                isMegaMenuOpen
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200 shadow-2xs'
              }`}
            >
              <Grid className="w-4 h-4 text-stone-500 group-hover:text-stone-900" />
              <span>Все направления конвертации</span>
              {isMegaMenuOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Batch Converter Tab */}
            <button
              type="button"
              id="tab-converter-btn"
              onClick={onNavigateToConverter}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all border cursor-pointer ${
                activeTab === 'converter'
                  ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-2xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Пакетный конвертер
              {queueCount > 0 && (
                <span className="bg-emerald-500 text-white rounded-full px-1.5 py-0.2 text-[10px] leading-tight font-bold">
                  {queueCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick popular conversion chips bar */}
        <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex items-center justify-between gap-2 overflow-x-auto text-xs text-stone-500 no-scrollbar">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium text-stone-600">Быстрый переход:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { src: 'srt', tgt: 'vtt', label: 'SRT ➔ VTT' },
              { src: 'vtt', tgt: 'srt', label: 'VTT ➔ SRT' },
              { src: 'gpx', tgt: 'kml', label: 'GPX ➔ KML' },
              { src: 'kml', tgt: 'gpx', label: 'KML ➔ GPX' },
              { src: 'obj', tgt: 'stl', label: 'OBJ ➔ STL 3D' },
              { src: 'stl', tgt: 'obj', label: 'STL ➔ OBJ' },
              { src: 'bib', tgt: 'ris', label: 'BibTeX ➔ RIS' },
              { src: 'fb2', tgt: 'epub', label: 'FB2 ➔ EPUB' },
              { src: 'cue', tgt: 'm3u8', label: 'CUE ➔ M3U' },
              { src: 'svg', tgt: 'png', label: 'SVG ➔ PNG' },
              { src: 'ics', tgt: 'csv', label: 'ICS ➔ CSV' },
            ].map((c, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onOpenFormatPage(c.src, c.tgt)}
                className={`px-2 py-0.5 rounded text-xs transition-colors whitespace-nowrap cursor-pointer border ${
                  activeTab === 'format-detail' && currentFormatId === c.src
                    ? 'bg-stone-900 text-white border-stone-900 font-semibold'
                    : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
