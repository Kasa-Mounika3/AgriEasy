import React from 'react';
import { cn } from '@/lib/utils';
import { imageFallback } from '@/lib/imageAssets';

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

export default function SafeImage({ className, fallbackSrc = imageFallback, loading = 'lazy', alt, ...props }: SafeImageProps) {
  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== fallbackSrc) {
      event.currentTarget.src = fallbackSrc;
    }
  };

  return (
    <img
      {...props}
      alt={alt || ''}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
      className={cn('object-cover', className)}
    />
  );
}
