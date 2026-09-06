import React, { useState } from 'react';
import {
  Search, ArrowRight, Sparkles, Filter, ExternalLink, FileCode, Check,
  ChevronRight, Download, Layers, ShieldCheck, Compass
} from 'lucide-react';
import { CATEGORIES, FORMATS } from '../converters';
import { FormatCategory, FormatSpec, FormatPreset } from '../types';
import { generateStandaloneHtml } from '../utils/standaloneHtmlGenerator';

interface FormatCatalogProps {
  onTestFormat: (formatId: string) => void;
  onOpenFormatPage: (formatId: string, preselectedTarget?: string) => void;
}

export const FormatCatalog: React.FC<FormatCatalogProps> = ({ onTestFormat, onOpenFormatPage }) => {
  const [viewMode, setViewMode] = useState<'formats' | 'presets'>('formats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter formats
  const filteredFormats = FORMATS.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      item.id.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.usedFor.toLowerCase().includes(q) ||
      item.targets.some(t => t.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  // Flat list of all presets across all formats
  const allPresets = FORMATS.flatMap(fmt =>
    (fmt.presets || []).map(preset => ({
      ...preset,
      sourceFormat: fmt,
    }))
  );

  // Filter presets
  const filteredPresets = allPresets.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.sourceFormat.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      p.label.toLowerCase().includes(q) ||
      p.targetFormat.toLowerCase().includes(q) ||
      p.sourceFormat.id.toLowerCase().includes(q) ||
      p.sourceFormat.name.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const handleDownloadStandaloneHtml = (fmt: FormatSpec, target: string) => {
    const html = generateStandaloneHtml(fmt, target);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converter_${fmt.id}_to_${target}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreviewStandaloneHtml = (fmt: FormatSpec, target: string) => {
    const html = generateStandaloneHtml(fmt, target);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="w-full space-y-6">
      {/* Search & Mode Switcher Section */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Оффлайн и без сервера
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
              Каталог форматов и персональные страницы
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Для каждого формата доступна отдельная страница со справкой из Википедии, FAQ и возможностью скачать автономный .html файл.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="catalog-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск: srt, vtt, gpx, kml, bib, obj..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all"
            />
          </div>
        </div>

        {/* View Mode Switcher: Formats vs Presets */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('formats')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'formats'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Все форматы ({FORMATS.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('presets')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'presets'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Готовые пресеты и HTML ({allPresets.length})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Все категории
          </button>
          {CATEGORIES.map(cat => {
            const count = FORMATS.filter(f => f.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: Standard Formats Cards */}
      {viewMode === 'formats' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFormats.map(fmt => {
            const categoryObj = CATEGORIES.find(c => c.id === fmt.category);

            return (
              <div
                key={fmt.id}
                id={`catalog-card-${fmt.id}`}
                className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 hover:border-stone-300 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFormatPage(fmt.id)}
                      className="px-3 py-1 rounded-xl bg-stone-900 text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      {fmt.extension}
                    </button>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                      {categoryObj?.name || fmt.category}
                    </span>
                  </div>

                  <div>
                    <h3
                      onClick={() => onOpenFormatPage(fmt.id)}
                      className="text-base font-bold text-stone-900 group-hover:text-stone-700 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <span>{fmt.name}</span>
                      <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 transition-colors" />
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed mt-1 line-clamp-2">
                      {fmt.description}
                    </p>
                  </div>

                  {/* Where it is used */}
                  <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">
                      Сфера использования:
                    </span>
                    <p className="text-stone-700 font-medium line-clamp-2">
                      {fmt.usedFor}
                    </p>
                  </div>

                  {/* Presets preview pills (clean label without developer subtitles) */}
                  {fmt.presets && fmt.presets.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-stone-400 font-medium block">
                        Готовые направления конвертации:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {fmt.presets.slice(0, 4).map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => onOpenFormatPage(fmt.id, p.targetFormat)}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors cursor-pointer"
                          >
                            ➔ .{p.targetFormat.toUpperCase()}
                          </button>
                        ))}
                        {fmt.presets.length > 4 && (
                          <span className="text-[10px] text-stone-400 self-center">
                            +{fmt.presets.length - 4} еще
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-4 mt-4 border-t border-stone-100 space-y-2">
                  <button
                    type="button"
                    id={`open-page-${fmt.id}`}
                    onClick={() => onOpenFormatPage(fmt.id)}
                    className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Открыть страницу {fmt.extension} и FAQ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    id={`test-format-${fmt.id}`}
                    onClick={() => onTestFormat(fmt.id)}
                    className="w-full py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Загрузить образец в пакетный конвертер
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: Presets & Standalone HTML Pages */}
      {viewMode === 'presets' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Что такое отдельные HTML-страницы пресетов?</strong>
              <p className="mt-0.5">
                Каждая строчка ниже — это готовый сценарий перевода одного формата в другой. Вы можете как открыть его прямо здесь в интерактивном режиме с FAQ из Википедии, так и <strong>скачать автономный HTML-файл</strong> на свой компьютер. Скачанный файл не требует сервера или интернета и работает вечно.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset, idx) => {
              const src = preset.sourceFormat;
              const categoryObj = CATEGORIES.find(c => c.id === src.category);

              return (
                <div
                  key={idx}
                  className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="font-bold px-2 py-0.5 rounded bg-stone-900 text-white">
                          {src.extension.toUpperCase()}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-800 border border-stone-200">
                          .{preset.targetFormat.toUpperCase()}
                        </span>
                      </div>

                      {preset.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {preset.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-stone-900 tracking-tight">
                      {preset.label}
                    </h4>

                    <span className="text-[11px] text-stone-500 block">
                      Категория: {categoryObj?.name || src.category}
                    </span>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenFormatPage(src.id, preset.targetFormat)}
                      className="w-full py-1.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Открыть конвертер</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePreviewStandaloneHtml(src, preset.targetFormat)}
                        className="flex-1 py-1.5 px-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3 text-stone-500" />
                        <span>HTML Просмотр</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadStandaloneHtml(src, preset.targetFormat)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-stone-700" />
                        <span>Скачать .html</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredFormats.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center">
          <p className="text-sm font-semibold text-stone-900 mb-1">Ничего не найдено</p>
          <p className="text-xs text-stone-500">
            По запросу «{searchQuery}» ничего не найдено. Попробуйте сбросить фильтры.
          </p>
        </div>
      )}
    </div>
  );
};
