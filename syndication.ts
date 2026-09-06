import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, ArrowRightLeft, FileCode, Image as ImageIcon } from 'lucide-react';
import { ConvertedFile } from '../types';

interface PreviewModalProps {
  file: ConvertedFile | null;
  onClose: () => void;
  onDownload: (file: ConvertedFile) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ file, onClose, onDownload }) => {
  const [activeTab, setActiveTab] = useState<'result' | 'source'>('result');
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;

    if (file.resultContent instanceof Blob) {
      if (file.resultContent.type.startsWith('image/')) {
        const url = URL.createObjectURL(file.resultContent);
        setImageUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    } else {
      setImageUrl(null);
    }
  }, [file]);

  if (!file) return null;

  const resultIsText = typeof file.resultContent === 'string';
  const resultText = resultIsText ? (file.resultContent as string) : '';

  const handleCopy = async () => {
    if (resultIsText) {
      await navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="preview-modal-box"
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900">
                {file.resultName || file.originalName}
              </h3>
              <p className="text-xs text-stone-500">
                Конвертировано из <span className="uppercase font-mono font-semibold text-stone-700">{file.sourceFormat}</span> в{' '}
                <span className="uppercase font-mono font-semibold text-stone-700">{file.targetFormat}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(file)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Скачать
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher & actions */}
        <div className="px-5 py-2.5 border-b border-stone-200/80 flex items-center justify-between bg-stone-100/40 text-xs">
          <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('result')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'result' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              Результат ({file.targetFormat.toUpperCase()})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('source')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                activeTab === 'source' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600'
              }`}
            >
              Исходный ({file.sourceFormat.toUpperCase()})
            </button>
          </div>

          {activeTab === 'result' && resultIsText && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать результат</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-5 bg-stone-50 font-mono text-xs text-stone-800">
          {activeTab === 'result' ? (
            imageUrl ? (
              <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-stone-200">
                <img
                  src={imageUrl}
                  alt="Converted output"
                  className="max-h-[50vh] object-contain shadow-xs rounded-lg border border-stone-200 mb-4"
                />
                <p className="text-stone-500 font-sans text-xs">
                  Растровое изображение PNG сгенерировано прямо в браузере через HTML5 Canvas.
                </p>
              </div>
            ) : file.resultContent instanceof Blob ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-stone-200 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <Download className="w-6 h-6" />
                </div>
                <h4 className="font-sans font-bold text-stone-900 text-base mb-1">
                  Бинарный файл готов ({file.targetFormat.toUpperCase()})
                </h4>
                <p className="font-sans text-xs text-stone-500 mb-4 max-w-sm">
                  Размер: {(file.resultContent.size / 1024).toFixed(1)} КБ. Нажмите кнопку ниже, чтобы сохранить его на диск.
                </p>
                <button
                  type="button"
                  onClick={() => onDownload(file)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Скачать {file.resultName}
                </button>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-all bg-white p-4 rounded-xl border border-stone-200 leading-relaxed overflow-x-auto selection:bg-stone-200">
                {resultText || 'Нет данных'}
              </pre>
            )
          ) : (
            <pre className="whitespace-pre-wrap break-all bg-white p-4 rounded-xl border border-stone-200 leading-relaxed overflow-x-auto selection:bg-stone-200">
              {typeof file.sourceContent === 'string' ? file.sourceContent : 'Двоичное содержимое'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
