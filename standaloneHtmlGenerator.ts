import React, { useRef, useState } from 'react';
import { UploadCloud, FileCode2, Archive, ClipboardPaste, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';
import { ConvertedFile } from '../types';
import { detectFormatByFilename, FORMATS } from '../converters';
import { useLanguage } from '../i18n';

interface DropZoneProps {
  onFilesAdded: (files: ConvertedFile[]) => void;
  onOpenPasteModal: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, onOpenPasteModal }) => {
  const { t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [zipMessage, setZipMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const processFileList = async (files: FileList | File[]) => {
    const newItems: ConvertedFile[] = [];
    setZipMessage(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filename = file.name;
      const lower = filename.toLowerCase();

      // Check if it's a ZIP archive
      if (lower.endsWith('.zip')) {
        setIsProcessingZip(true);
        try {
          const zip = await JSZip.loadAsync(file);
          let extractedCount = 0;
          const entries = Object.keys(zip.files);

          for (const relativePath of entries) {
            const zipEntry = zip.files[relativePath];
            if (zipEntry.dir) continue;

            const entryName = relativePath.split('/').pop() || relativePath;
            const detected = detectFormatByFilename(entryName);
            if (detected) {
              const textContent = await zipEntry.async('string');
              newItems.push({
                id: `zip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                originalName: entryName,
                originalExtension: detected.extension,
                size: textContent.length,
                sourceFormat: detected.id,
                targetFormat: detected.targets[0] || 'txt',
                status: 'idle',
                sourceContent: textContent,
                isZipExtracted: true,
              });
              extractedCount++;
            }
          }

          setZipMessage(`Из архива «${file.name}» успешно извлечено ${extractedCount} спецфайлов.`);
        } catch (err: any) {
          console.error('ZIP extraction error:', err);
          setZipMessage(`Ошибка чтения ZIP архива: ${err.message}`);
        } finally {
          setIsProcessingZip(false);
        }
        continue;
      }

      // Normal file
      const detected = detectFormatByFilename(filename);
      const ext = filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '';
      const sourceFmt = detected ? detected.id : ext.replace('.', '').toLowerCase();
      const defaultTarget = detected?.targets[0] || (sourceFmt === 'srt' ? 'vtt' : 'txt');

      try {
        const textContent = await file.text();
        newItems.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          originalName: filename,
          originalExtension: ext,
          size: file.size,
          sourceFormat: sourceFmt,
          targetFormat: defaultTarget,
          status: 'idle',
          sourceContent: textContent,
        });
      } catch (err) {
        console.error('Failed to read file:', filename, err);
      }
    }

    if (newItems.length > 0) {
      onFilesAdded(newItems);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileList(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        id="dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-[32px] p-10 sm:p-14 transition-all text-center group ${
          isDragOver
            ? 'border-stone-900 bg-stone-50 scale-[1.01]'
            : 'border-stone-200 hover:border-stone-400 hover:bg-stone-50/50 bg-white shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="hidden-file-input"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={zipInputRef}
          type="file"
          id="hidden-zip-input"
          accept=".zip"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className={`w-16 h-16 rounded-3xl bg-white border border-stone-200 text-stone-700 flex items-center justify-center mb-6 shadow-sm transition-transform duration-300 ${isDragOver ? 'scale-110' : 'group-hover:-translate-y-1'}`}>
            <UploadCloud className="w-8 h-8 text-stone-500" strokeWidth={1.5} />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2 tracking-tight">
            {t('dragFiles')}
          </h3>
          <p className="text-sm text-stone-500 mb-8 max-w-md leading-relaxed" dangerouslySetInnerHTML={{ __html: t('dragDesc') }} />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              id="choose-files-btn"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-[14px] font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <FileCode2 className="w-4 h-4" strokeWidth={2} />
              {t('chooseFiles')}
            </button>

            <button
              type="button"
              id="choose-zip-btn"
              onClick={() => zipInputRef.current?.click()}
              className="px-5 py-3 rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-sm text-[14px] font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <Archive className="w-4 h-4 text-stone-400" strokeWidth={2} />
              {t('uploadZip')}
            </button>

            <button
              type="button"
              id="paste-text-btn"
              onClick={onOpenPasteModal}
              className="px-5 py-3 rounded-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 shadow-sm text-[14px] font-medium transition-all flex items-center gap-2 cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4 text-stone-400" strokeWidth={2} />
              {t('pasteText')}
            </button>
          </div>

          {/* Formats banner pills */}
          <div className="mt-6 pt-5 border-t border-stone-100 w-full flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-stone-500">
            <span className="font-semibold text-stone-700">Популярные форматы:</span>
            {['.srt', '.vtt', '.ass', '.gpx', '.kml', '.fb2', '.cue', '.har', '.ics', '.vcf', '.svg', '.yaml', '.xml'].map(ext => (
              <span
                key={ext}
                className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>

        {isProcessingZip && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-3 border-stone-900 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-stone-800">Распаковка и анализ содержимого ZIP-архива...</p>
          </div>
        )}
      </div>

      {zipMessage && (
        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{zipMessage}</span>
        </div>
      )}
    </div>
  );
};
