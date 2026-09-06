import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ru' | 'pt';

type Translations = {
  [key in Language]: {
    [key: string]: string;
  };
};

export const dict: Translations = {
  en: {
    title: 'Specialized Formats Converter',
    privacy: 'Full Privacy',
    subtitle: 'Support for subtitles, 3D, geodata, ebooks, playlists, and tables',
    fastPrivate: 'Fast, private, and no limits',
    fastPrivateDesc: 'Instant conversion of single files or batch processing of entire folders.',
    back: 'Go back',
    changeFormat: 'Change format:',
    workspace: 'Workspace',
    sample: 'Sample',
    upload: 'Upload file',
    chars: 'characters',
    converting: 'Processing...',
    convertBtn: 'Convert to',
    success: 'Success',
    copy: 'Copy',
    copied: 'Copied',
    download: 'Download',
    faqTitle: 'Information & FAQ',
    faqQ1: 'What is a {ext} file?',
    faqA1: 'A {ext} file is a specialized data format. Our converter allows you to quickly and securely process it directly in your browser.',
    faqQ2: 'How to convert {source} to {target}?',
    faqA2: 'Simply upload your {source} file to the workspace above, or paste the text, and click the "Convert to .{target}" button. The result will appear instantly.',
    faqQ3: 'Are there any limits on file size or quantity?',
    faqA3: 'No, there are no limits. Since the conversion happens locally on your device, you can process as many files as your device can handle, entirely for free.',
    allSupported: 'All supported formats',
    targetFormat: 'Target format',
    conversionFrom: 'Conversion from {source} to {target}',
    conversionDesc: 'Fast conversion of {name} ({ext}) to .{target}. Fast, private, and no limits.',
    dragFiles: 'Drag and drop files here',
    dragDesc: 'Supports single files, batch processing, and ZIP archives. Everything happens locally.',
    chooseFiles: 'Choose files',
    uploadZip: 'Upload ZIP',
    pasteText: 'Paste text',
  },
  ru: {
    title: 'Конвертер спецформатов',
    privacy: 'Полная приватность',
    subtitle: 'Поддержка субтитров, 3D, геоданных, книг, плейлистов и таблиц',
    fastPrivate: 'Быстро, приватно и без лимитов',
    fastPrivateDesc: 'Мгновенная конвертация одиночных файлов или пакетная обработка целых папок.',
    back: 'Вернуться назад',
    changeFormat: 'Сменить формат:',
    workspace: 'Рабочая область',
    sample: 'Образец',
    upload: 'Загрузить файл',
    chars: 'символов',
    converting: 'Обработка...',
    convertBtn: 'Конвертировать в',
    success: 'Успешно',
    copy: 'Копировать',
    copied: 'Скопировано',
    download: 'Скачать',
    faqTitle: 'Справка и FAQ',
    faqQ1: 'Что такое файл {ext}?',
    faqA1: 'Файл {ext} — это специализированный формат данных. Наш инструмент позволяет быстро и безопасно работать с ним прямо в браузере.',
    faqQ2: 'Как конвертировать {source} в {target}?',
    faqA2: 'Просто загрузите файл {source} в рабочую область выше или вставьте текст, и нажмите кнопку «Конвертировать в .{target}». Результат появится мгновенно.',
    faqQ3: 'Есть ли лимиты на размер или количество файлов?',
    faqA3: 'Нет, лимиты отсутствуют. Конвертация происходит локально на вашем устройстве, поэтому вы можете обрабатывать файлы любых объемов абсолютно бесплатно.',
    allSupported: 'Все поддерживаемые форматы',
    targetFormat: 'Целевой формат',
    conversionFrom: 'Конвертация из {source} в {target}',
    conversionDesc: 'Быстрый перевод файлов {name} ({ext}) в формат .{target}. Быстро, приватно и без лимитов.',
    dragFiles: 'Перетащите файлы сюда',
    dragDesc: 'Поддерживаются одиночные файлы, пакетная загрузка и ZIP-архивы. Вся обработка происходит строго локально.',
    chooseFiles: 'Выбрать файлы',
    uploadZip: 'Загрузить ZIP',
    pasteText: 'Вставить текст',
  },
  pt: {
    title: 'Conversor de Formatos',
    privacy: 'Privacidade Total',
    subtitle: 'Suporte para legendas, 3D, geodados, e-books e tabelas',
    fastPrivate: 'Rápido, privado e sem limites',
    fastPrivateDesc: 'Conversão instantânea de arquivos únicos ou processamento em lote.',
    back: 'Voltar',
    changeFormat: 'Mudar formato:',
    workspace: 'Área de trabalho',
    sample: 'Amostra',
    upload: 'Enviar arquivo',
    chars: 'caracteres',
    converting: 'Processando...',
    convertBtn: 'Converter para',
    success: 'Sucesso',
    copy: 'Copiar',
    copied: 'Copiado',
    download: 'Baixar',
    faqTitle: 'Informações e FAQ',
    faqQ1: 'O que é um arquivo {ext}?',
    faqA1: 'Um arquivo {ext} é um formato de dados especializado. Nosso conversor permite processá-lo de forma rápida e segura diretamente no seu navegador.',
    faqQ2: 'Como converter {source} para {target}?',
    faqA2: 'Basta enviar seu arquivo {source} para a área de trabalho acima ou colar o texto e clicar no botão "Converter para .{target}". O resultado aparecerá instantaneamente.',
    faqQ3: 'Existem limites de tamanho ou quantidade de arquivos?',
    faqA3: 'Não, não há limites. Como a conversão ocorre localmente no seu dispositivo, você pode processar quantos arquivos quiser, de forma totalmente gratuita.',
    allSupported: 'Todos os formatos suportados',
    targetFormat: 'Formato de destino',
    conversionFrom: 'Conversão de {source} para {target}',
    conversionDesc: 'Conversão rápida de arquivos {name} ({ext}) para .{target}. Rápido, privado e sem limites.',
    dragFiles: 'Arraste os arquivos para cá',
    dragDesc: 'Suporta arquivos únicos, processamento em lote e arquivos ZIP. Todo o processo é local.',
    chooseFiles: 'Escolher arquivos',
    uploadZip: 'Enviar ZIP',
    pasteText: 'Colar texto',
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    // 1. Detect language from URL Path (e.g. /ru/ or /pt/) for SSG SEO
    const path = window.location.pathname;
    if (path.startsWith('/ru/') || path === '/ru') {
      setLangState('ru');
      return;
    }
    if (path.startsWith('/pt/') || path === '/pt') {
      setLangState('pt');
      return;
    }
    
    // 2. Fallback to localStorage or browser lang for root '/'
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved && (saved === 'en' || saved === 'ru' || saved === 'pt')) {
      setLangState(saved);
    } else {
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === 'ru' || browserLang === 'pt') {
        setLangState(browserLang as Language);
      } else {
        setLangState('en');
      }
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('app_lang', l);
    // If we are on a specific path, redirect to the correct language path
    const path = window.location.pathname;
    const match = path.match(/^\/(?:ru|pt)?\/?([a-z0-9]+-to-[a-z0-9]+)?\/?$/i);
    if (match) {
      const formatPart = match[1] || '';
      const newPath = l === 'en' ? `/${formatPart}` : `/${l}/${formatPart}`;
      window.history.pushState({}, '', newPath.replace(/\/$/, '') + '/');
    }
  };

  const translate = (key: string, params?: Record<string, string>) => {
    let str = dict[lang]?.[key] || dict['en'][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{${k}}`, 'g'), v);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
