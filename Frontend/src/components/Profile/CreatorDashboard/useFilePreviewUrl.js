import { useEffect, useState } from 'react';

export default function useFilePreviewUrl(file) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return undefined;

    const url = URL.createObjectURL(file);
    let isCurrent = true;
    Promise.resolve().then(() => {
      if (isCurrent) setPreview({ file, url });
    });

    return () => {
      isCurrent = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return preview?.file === file ? preview.url : '';
}
