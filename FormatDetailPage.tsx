import React, { useState } from 'react';
import { X, ClipboardPaste, ArrowRight } from 'lucide-react';
import { FORMATS } from '../converters';
import { ConvertedFile } from '../types';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTextFile: (file: ConvertedFile) => void;
}

export const PasteModal: React.FC<PasteModalProps> = ({ isOpen, onClose, onAddTextFile }) => {
  const [formatId, setFormatId] = useState<string>('srt');
  const [content, setContent] = useState<string>('');
  const [customName, setCustomName] = useState<string>('snippet');

  if (!isOpen) return null;

  const currentSpec = FORMATS.find(f => f.id === formatId);
  const defaultTarget = currentSpec?.targets[0] || 'txt';

  const handleAdd = () => {
    if (!content.trim()) return;

    const ext = currentSpec?.extension || `.${formatId}`;
    const filename = `${customName.trim() || 'snippet'}${ext}`;

    const newFile: ConvertedFile = {
      id: `paste-${Date.now()}`,
      originalName: filename,
      originalExtension: ext,
      size: new Blob([content]).size,
      sourceFormat: formatId,
      targetFormat: defaultTarget,
      status: 'idle',
      sourceContent: content,
    };

    onAddTextFile(newFile);
    setContent('');
    onClose();
  };

  const handleLoadSample = () => {
    if (currentSpec?.sampleContent) {
      setContent(currentSpec.sampleContent);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="paste-modal-box"
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold">
              <ClipboardPaste className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                Вставить текст напрямую
              </h3>
              <p className="text-xs text-stone-500">
                Создайте виртуальный файл из скопированного текста для мгновенной конвертации
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Формат вставляемого текста:
              </label>
              <select
                id="paste-format-select"
                value={formatId}
                onChange={e => setFormatId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                {FORMATS.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.extension})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Имя виртуального файла:
              </label>
              <input
                type="text"
                id="paste-filename-input"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="например, subtitles_ep01"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">Содержимое:</label>
              {currentSpec?.sampleContent && (
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-stone-500 hover:text-stone-900 font-medium underline"
                >
                  Вставить тестовый образец {currentSpec.id.toUpperCase()}
                </button>
              )}
            </div>
            <textarea
              id="paste-textarea"
              rows={9}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Вставьте сюда текст (например, блок субтитров SRT, дорожку CUE, XML гео-трек GPX или JSON)..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 font-mono text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-stone-200 flex items-center justify-end gap-2 bg-stone-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium text-xs transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            id="paste-submit-btn"
            disabled={!content.trim()}
            onClick={handleAdd}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-medium text-xs transition-colors shadow-xs"
          >
            Добавить в очередь
          </button>
        </div>
      </div>
    </div>
  );
};
