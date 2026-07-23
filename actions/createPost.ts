"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { addPost } from "@/action";

const abortController = new AbortController();

const authenticator = async () => {
  try {
    // Determine the base URL for server-side fetch
    let baseUrl = "";
    if (typeof window === "undefined") {
      // On server, use environment variable or default to localhost
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    }
    const response = await fetch(`${baseUrl}/api/upload-auth`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`,
      );
    }
    const data = await response.json();
    const { signature, expire, token, publicKey } = data;
    return { signature, expire, token, publicKey };
  } catch (error) {
    console.error("Authentication error:", error);
    throw new Error("Authentication request failed");
  }
};

export const createPostAction = async (
  prevState: { success: boolean; error: boolean },
  formData: FormData,
) => {
  const file = formData.get("file") as File | null;
  let img = "";
  let imgHeight = 0;
  let video = "";

  if (file) {
    let authParams;
    try {
      authParams = await authenticator();
    } catch (authError) {
      console.error("Failed to authenticate for upload:", authError);
      return;
    }
    const { signature, expire, token, publicKey } = authParams;

    try {
      const uploadResponse = await upload({
        // Authentication parameters
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: file.name,
        folder: "/posts",
        abortSignal: abortController.signal,
        ...(file.type.includes("image") && {
          transformation: {
            pre: "w-600",
          },
        }),
      });
      if (uploadResponse.fileType === "image") {
        img = uploadResponse.filePath as string;
        imgHeight = uploadResponse.height as number;
      }

      if (uploadResponse.fileType === "non-image") {
        video = uploadResponse.filePath as string;
      }
    } catch (error) {
      // Handle specific error types provided by the ImageKit SDK.
      if (error instanceof ImageKitAbortError) {
        console.error("Upload aborted:", error.reason);
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid request:", error.message);
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Network error:", error.message);
      } else if (error instanceof ImageKitServerError) {
        console.error("Server error:", error.message);
      } else {
        // Handle any other errors that may occur.
        console.error("Upload error:", error);
      }
    }
  }
  formData.set("img", img);
  formData.set("video", video);
  formData.set("imgHeight", String(imgHeight));

  return await addPost(prevState, formData);
};
