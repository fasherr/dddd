import React from 'react';
import {
  FileText, CheckCircle2, AlertTriangle, Loader2, Download, Eye, Trash2,
  RefreshCw, ArrowRight, Archive, Sparkles, Copy, FileCheck
} from 'lucide-react';
import { ConvertedFile } from '../types';
import { FORMATS } from '../converters';

interface FileQueueProps {
  files: ConvertedFile[];
  onConvertFile: (id: string) => Promise<void>;
  onConvertAll: () => Promise<void>;
  onDownloadFile: (file: ConvertedFile) => void;
  onDownloadAllZip: () => Promise<void>;
  onRemoveFile: (id: string) => void;
  onClearAll: () => void;
  onChangeTarget: (id: string, newTarget: string) => void;
  onPreviewFile: (file: ConvertedFile) => void;
  isConvertingAll: boolean;
  isZippingAll: boolean;
}

export const FileQueue: React.FC<FileQueueProps> = ({
  files,
  onConvertFile,
  onConvertAll,
  onDownloadFile,
  onDownloadAllZip,
  onRemoveFile,
  onClearAll,
  onChangeTarget,
  onPreviewFile,
  isConvertingAll,
  isZippingAll,
}) => {
  if (files.length === 0) return null;

  const totalCount = files.length;
  const completedCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getTargetOptions = (sourceFormat: string): string[] => {
    const spec = FORMATS.find(f => f.id === sourceFormat.toLowerCase());
    if (spec && spec.targets.length > 0) {
      return spec.targets;
    }
    return ['txt', 'json'];
  };

  return (
    <div className="w-full space-y-4">
      {/* Batch Header Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-stone-900">
              Очередь файлов на обработку
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold">
              {completedCount} из {totalCount} готово
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Общий объем данных: {formatSize(totalBytes)} • Выполняется локально в памяти
          </p>
        </div>

        {/* Batch Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="convert-all-btn"
            disabled={isConvertingAll}
            onClick={onConvertAll}
            className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs sm:text-sm font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isConvertingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Конвертация...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Конвертировать все ({totalCount})
              </>
            )}
          </button>

          {completedCount > 0 && (
            <button
              type="button"
              id="download-all-zip-btn"
              disabled={isZippingAll}
              onClick={onDownloadAllZip}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isZippingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Упаковка в ZIP...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  Скачать всё архивом .ZIP ({completedCount})
                </>
              )}
            </button>
          )}

          <button
            type="button"
            id="clear-queue-btn"
            onClick={onClearAll}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            title="Очистить очередь файлов"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File List Items */}
      <div className="space-y-2.5">
        {files.map(file => {
          const targetOptions = getTargetOptions(file.sourceFormat);

          return (
            <div
              key={file.id}
              id={`file-row-${file.id}`}
              className={`bg-white border rounded-xl p-3.5 sm:p-4 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                file.status === 'success'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : file.status === 'error'
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              {/* File Info */}
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase ${
                    file.status === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : file.status === 'error'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {file.sourceFormat.slice(0, 4)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-900 text-sm truncate max-w-xs sm:max-w-md" title={file.originalName}>
                      {file.originalName}
                    </span>
                    {file.isZipExtracted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        из ZIP
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                    <span>{formatSize(file.size)}</span>
                    <span>•</span>
                    <span className="font-mono uppercase text-[11px] font-medium text-stone-600">
                      {file.sourceFormat}
                    </span>
                    {file.conversionTimeMs !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {file.conversionTimeMs} мс
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: Target selection & Status */}
              <div className="flex items-center gap-3 self-start md:self-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-stone-500 hidden sm:inline">В формат:</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 sm:hidden" />
                  <select
                    id={`target-select-${file.id}`}
                    value={file.targetFormat}
                    disabled={file.status === 'converting'}
                    onChange={e => onChangeTarget(file.id, e.target.value)}
                    className="bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-900 uppercase focus:outline-none focus:ring-1 focus:ring-stone-400 cursor-pointer"
                  >
                    {targetOptions.map(opt => (
                      <option key={opt} value={opt}>
                        .{opt.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status indicator */}
                <div className="w-24 text-right">
                  {file.status === 'idle' && (
                    <span className="text-xs text-stone-500">Готов</span>
                  )}
                  {file.status === 'converting' && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Обработка...
                    </span>
                  )}
                  {file.status === 'success' && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Готово
                    </span>
                  )}
                  {file.status === 'error' && (
                    <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-semibold" title={file.errorMessage}>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Ошибка
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 w-full md:w-auto justify-end">
                {file.status !== 'success' && (
                  <button
                    type="button"
                    onClick={() => onConvertFile(file.id)}
                    disabled={file.status === 'converting'}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Конвертировать
                  </button>
                )}

                {file.status === 'success' && (
                  <>
                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      title="Просмотреть результат и код"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Просмотр</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownloadFile(file)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Скачать сконвертированный файл"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Скачать</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveFile(file.id)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                  title="Удалить из очереди"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
