import { Video } from '@imagekit/next';

type VideoType = {
  src: string;
  className?: string;
}

const imageKitURL= process.env.NEXT_PUBLIC_URL_ENDPOINT

const VideoComp = ({ src, className }: VideoType) => {
  return (
    <Video
      urlEndpoint={imageKitURL}
      src={src}
      controls
      className={className}
      transformation={[{ width: 600, height: 400, quality: 90 }]}
    />
  )
}

export default VideoComp