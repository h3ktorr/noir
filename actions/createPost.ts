"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";

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

export const createPostAction = async (data: FormData) => {
  const file = data.get("file") as File;
  if (!file) {
    console.error("No file provided");
    return;
  }

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
    console.log("Upload response:", uploadResponse);
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
};
