// SVG and vector operations client-side

export async function svgToRasterBlob(
  svgString: string,
  format: 'image/png' | 'image/webp' | 'image/jpeg' = 'image/png',
  scale = 2,
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElem = doc.querySelector('svg');
    if (!svgElem) {
      reject(new Error('Недопустимое содержимое SVG: тег <svg> не найден'));
      return;
    }

    let width = parseFloat(svgElem.getAttribute('width') || '300');
    let height = parseFloat(svgElem.getAttribute('height') || '300');

    const viewBox = svgElem.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+|,/).map(parseFloat).filter(n => !isNaN(n));
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(16, Math.round(width * scale));
    canvas.height = Math.max(16, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // For JPEG, fill white background
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      if (format !== 'image/jpeg') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        resultBlob => {
          if (resultBlob) resolve(resultBlob);
          else reject(new Error(`Не удалось сгенерировать ${format}`));
        },
        format,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось отобразить векторный SVG на Canvas'));
    };

    img.src = url;
  });
}

export async function svgToPNG(svgString: string, scale = 2): Promise<Blob> {
  return svgToRasterBlob(svgString, 'image/png', scale);
}

export async function svgToWebP(svgString: string, scale = 2): Promise<Blob> {
  return svgToRasterBlob(svgString, 'image/webp', scale);
}

export async function svgToJPEG(svgString: string, scale = 2): Promise<Blob> {
  return svgToRasterBlob(svgString, 'image/jpeg', scale);
}

export function svgToDataURI(svgString: string): string {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;utf8,${encoded}`;
}

export function svgToReactComponent(svgString: string, componentName = 'Icon'): string {
  let jsx = svgString
    .replace(/<\?xml.*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  const replacements: [RegExp, string][] = [
    [/class=/g, 'className='],
    [/stroke-width=/g, 'strokeWidth='],
    [/stroke-linecap=/g, 'strokeLinecap='],
    [/stroke-linejoin=/g, 'strokeLinejoin='],
    [/stroke-miterlimit=/g, 'strokeMiterlimit='],
    [/stroke-dasharray=/g, 'strokeDasharray='],
    [/stroke-dashoffset=/g, 'strokeDashoffset='],
    [/stroke-opacity=/g, 'strokeOpacity='],
    [/fill-rule=/g, 'fillRule='],
    [/fill-opacity=/g, 'fillOpacity='],
    [/clip-rule=/g, 'clipRule='],
    [/clip-path=/g, 'clipPath='],
    [/stop-color=/g, 'stopColor='],
    [/stop-opacity=/g, 'stopOpacity='],
    [/font-size=/g, 'fontSize='],
    [/font-family=/g, 'fontFamily='],
    [/text-anchor=/g, 'textAnchor='],
    [/xlink:href=/g, 'xlinkHref='],
    [/xmlns:xlink=/g, 'xmlnsXlink='],
  ];

  for (const [pattern, repl] of replacements) {
    jsx = jsx.replace(pattern, repl);
  }

  jsx = jsx.replace(/<svg\b([^>]*)>/i, '<svg $1 {...props}>');

  return `import React from 'react';

export default function ${componentName}(props: React.SVGProps<SVGSVGElement>) {
  return (
    ${jsx}
  );
}
`;
}
