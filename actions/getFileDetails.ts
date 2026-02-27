"use server";

import ImageKit from "imagekit";

export interface FileDetailsResponse {
  width: number;
  height: number;
  url: string;
  fileType: string;
  filePath: string;
}

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
  privateKey: process.env.PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT!,
});

export async function getFileDetails(
  fileId: string,
): Promise<FileDetailsResponse | null> {
  try {
    const result = await imagekit.getFileDetails(fileId);

    return {
      width: result.width,
      height: result.height,
      url: result.url,
      fileType: result.fileType,
      filePath: result.filePath,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
