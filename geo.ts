/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { ConvertedFile } from './types';
import { convertContent, FORMATS } from './converters';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileQueue } from './components/FileQueue';
import { MegaMenuDropdown } from './components/MegaMenuDropdown';
import { FormatDetailPage } from './components/FormatDetailPage';
import { PreviewModal } from './components/PreviewModal';
import { PasteModal } from './components/PasteModal';
import { ShieldCheck, HardDrive, Zap, CheckCircle2, BookOpen, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'converter' | 'format-detail'>('converter');
  const [selectedFormatId, setSelectedFormatId] = useState<string>('srt');
  const [selectedTargetFormat, setSelectedTargetFormat] = useState<string | undefined>(undefined);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState<boolean>(false);
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<ConvertedFile | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [isConvertingAll, setIsConvertingAll] = useState<boolean>(false);
  const [isZippingAll, setIsZippingAll] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync with URL Hash and Path on mount and on popstate
  useEffect(() => {
    const handleHashChange = () => {
      // 1. First check Path (for SSG like /ru/ttml-to-srt/)
      const path = window.location.pathname;
      const pathMatch = path.match(/^\/(?:ru|pt)?\/?(?:convert\/)?([a-z0-9]+)-to-([a-z0-9]+)\/?$/i);
      if (pathMatch) {
        const source = pathMatch[1].toLowerCase();
        const target = pathMatch[2].toLowerCase();
        const foundFormat = FORMATS.find(f => f.id === source);
        if (foundFormat && foundFormat.targets.includes(target)) {
          setSelectedFormatId(foundFormat.id);
          setSelectedTargetFormat(target);
          setActiveTab('format-detail');
          return; // Exit early, path wins
        }
      }

      // 2. Fallback to Hash
      const hash = window.location.hash;
      if (hash.startsWith('#format-')) {
        const raw = hash.replace('#format-', '');
        let fmtId = raw;
        let tgt: string | undefined = undefined;

        if (FORMATS.some(f => f.id === raw)) {
          fmtId = raw;
        } else {
          // Check matching format prefix
          for (const f of FORMATS) {
            if (raw.startsWith(`${f.id}-`)) {
              fmtId = f.id;
              tgt = raw.substring(f.id.length + 1);
              break;
            }
          }
        }

        const matchedFormat = FORMATS.find(f => f.id === fmtId);
        if (matchedFormat) {
          setSelectedFormatId(matchedFormat.id);
          if (tgt && matchedFormat.targets.includes(tgt)) {
            setSelectedTargetFormat(tgt);
          } else {
            setSelectedTargetFormat(undefined);
          }
          setActiveTab('format-detail');
        }
      } else if (hash === '#catalog') {
        setIsMegaMenuOpen(true);
        setActiveTab('converter');
      } else if (hash === '#converter') {
        setActiveTab('converter');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenFormatPage = (formatId: string, preselectedTarget?: string) => {
    setSelectedFormatId(formatId);
    setSelectedTargetFormat(preselectedTarget);
    setActiveTab('format-detail');
    setIsMegaMenuOpen(false);
    window.location.hash = `#format-${formatId}${preselectedTarget ? `-${preselectedTarget}` : ''}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: 'converter' | 'catalog') => {
    setActiveTab(tab);
    window.location.hash = tab === 'catalog' ? '#catalog' : '#converter';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilesAdded = (newFiles: ConvertedFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    showToast(`Добавлено файлов в очередь: ${newFiles.length}`);
  };

  const handleChangeTarget = (id: string, newTarget: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id === id) {
          return {
            ...f,
            targetFormat: newTarget,
            status: 'idle',
            resultContent: undefined,
            resultName: undefined,
          };
        }
        return f;
      })
    );
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const handleConvertFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    setFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, status: 'converting', errorMessage: undefined } : f))
    );

    const startTime = performance.now();

    try {
      const sourceStr =
        typeof file.sourceContent === 'string'
          ? file.sourceContent
          : new TextDecoder().decode(file.sourceContent);

      const { result, outputFilename } = await convertContent(
        sourceStr,
        file.sourceFormat,
        file.targetFormat,
        file.originalName
      );

      const elapsed = Math.round(performance.now() - startTime);

      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: 'success',
                resultContent: result,
                resultName: outputFilename,
                conversionTimeMs: elapsed,
              }
            : f
        )
      );
    } catch (err: any) {
      console.error('Conversion failed for', file.originalName, err);
      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: 'error',
                errorMessage: err.message || 'Ошибка обработки данных',
              }
            : f
        )
      );
    }
  };

  const handleConvertAll = async () => {
    setIsConvertingAll(true);
    const toConvert = files.filter(f => f.status !== 'success');

    for (const file of toConvert) {
      await handleConvertFile(file.id);
    }

    setIsConvertingAll(false);
    showToast('Пакетная конвертация всех файлов завершена!');
  };

  const handleDownloadFile = (file: ConvertedFile) => {
    if (!file.resultContent || !file.resultName) return;

    let blob: Blob;
    if (file.resultContent instanceof Blob) {
      blob = file.resultContent;
    } else {
      blob = new Blob([file.resultContent], { type: 'text/plain;charset=utf-8' });
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.resultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    const successFiles = files.filter(f => f.status === 'success' && f.resultContent && f.resultName);
    if (successFiles.length === 0) return;

    setIsZippingAll(true);

    try {
      const zip = new JSZip();

      for (const file of successFiles) {
        if (file.resultContent instanceof Blob) {
          zip.file(file.resultName!, file.resultContent);
        } else {
          zip.file(file.resultName!, file.resultContent as string);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted_specialized_files_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`ZIP-архив с ${successFiles.length} файлами успешно создан!`);
    } catch (err: any) {
      console.error('Failed to create ZIP archive:', err);
      showToast(`Ошибка формирования ZIP: ${err.message}`);
    } finally {
      setIsZippingAll(false);
    }
  };

  const handleLoadSample = (formatId: string) => {
    const spec = FORMATS.find(f => f.id === formatId);
    if (!spec || !spec.sampleContent) return;

    const newFile: ConvertedFile = {
      id: `sample-${Date.now()}-${formatId}`,
      originalName: `sample_${formatId}${spec.extension}`,
      originalExtension: spec.extension,
      size: new Blob([spec.sampleContent]).size,
      sourceFormat: spec.id,
      targetFormat: spec.targets[0] || 'txt',
      status: 'idle',
      sourceContent: spec.sampleContent,
    };

    setFiles(prev => [newFile, ...prev]);
    setActiveTab('converter');
    showToast(`Образец ${spec.name} добавлен в очередь!`);
  };

  const currentSelectedFormat = FORMATS.find(f => f.id === selectedFormatId) || FORMATS[0];

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-stone-900 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onNavigateToConverter={() => {
          setActiveTab('converter');
          window.location.hash = '#converter';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        queueCount={files.length}
        currentFormatId={selectedFormatId}
        onOpenFormatPage={handleOpenFormatPage}
        onToggleMegaMenu={() => setIsMegaMenuOpen(prev => !prev)}
        isMegaMenuOpen={isMegaMenuOpen}
      />

      {/* MegaMenu Dropdown Window from top */}
      <MegaMenuDropdown
        isOpen={isMegaMenuOpen}
        onClose={() => setIsMegaMenuOpen(false)}
        onSelectConversion={handleOpenFormatPage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {activeTab === 'converter' && (
          <div className="space-y-6">
            {/* Privacy and Local Processing Guarantee Bar */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 grid grid-cols-1 gap-6 text-[13px] mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">Быстро, приватно и без лимитов</h4>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <DropZone
              onFilesAdded={handleFilesAdded}
              onOpenPasteModal={() => setIsPasteModalOpen(true)}
            />

            {/* Files Queue List */}
            <FileQueue
              files={files}
              onConvertFile={handleConvertFile}
              onConvertAll={handleConvertAll}
              onDownloadFile={handleDownloadFile}
              onDownloadAllZip={handleDownloadAllZip}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
              onChangeTarget={handleChangeTarget}
              onPreviewFile={f => setPreviewFile(f)}
              isConvertingAll={isConvertingAll}
              isZippingAll={isZippingAll}
            />
          </div>
        )}

        {activeTab === 'format-detail' && currentSelectedFormat && (
          <FormatDetailPage
            format={currentSelectedFormat}
            initialTarget={selectedTargetFormat}
            onBack={() => {
              setActiveTab('converter');
              window.location.hash = '#converter';
            }}
            onSelectFormat={handleOpenFormatPage}
            onSendToBatchQueue={file => {
              setFiles(prev => [file, ...prev]);
              showToast(`Файл «${file.originalName}» отправлен в очередь`);
            }}
            onNavigateToConverter={() => {
              setActiveTab('converter');
              window.location.hash = '#converter';
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-stone-800">
              Локальный конвертер специализированных форматов файлов
            </p>
            <p className="mt-0.5">
              Субтитры (SRT, VTT, ASS, TTML), геоданные (GPX, KML, NMEA), 3D сетки (OBJ, STL), библиография (BibTeX, RIS), книги (FB2), аудио (CUE) и конфиги.
            </p>
          </div>
          <div className="flex items-center gap-4 text-stone-600">
            <span>Одиночные файлы • Пакеты • ZIP архивы • Оффлайн</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
      />

      <PasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onAddTextFile={file => {
          setFiles(prev => [file, ...prev]);
          showToast(`Файл «${file.originalName}» добавлен в очередь`);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
