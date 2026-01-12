import { Image, ImageKitProvider } from '@imagekit/next';

type ImageType = {
 src: string;
 alt: string;
 w?: number;
 h?: number;
 className?: string;
 tr?: boolean;
}

const imageKitURL= process.env.NEXT_PUBLIC_URL_ENDPOINT

export default function Page({src, alt, w, h, className, tr}: ImageType) {
  return (
    <ImageKitProvider urlEndpoint={imageKitURL}>
      <Image
        src={src}
        width={w}
        height={h}
        alt={alt}
        className={className}
      />
    </ImageKitProvider>
  )
}
