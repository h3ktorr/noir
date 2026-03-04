import { Video } from '@imagekit/next';

type VideoType = {
  src: string;
  className?: string;
  w?: number;
  h?: number;
  tr?: boolean;
}

const imageKitURL= process.env.NEXT_PUBLIC_URL_ENDPOINT

const VideoComp = ({ src, className, w, h, tr }: VideoType) => {
  return (
    <Video
      urlEndpoint={imageKitURL}
      src={src}
      controls
      className={className}
      {... (tr && { transformation: [{ height: h, width: w, quality: 90 }] })}
    />
  )
}

export default VideoComp