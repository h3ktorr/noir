
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@imagekit/next";
import { X, ImagePlus, Upload } from "lucide-react";
import { createStory } from "@/actions/createStory";

type CreateStoryProps = {
  onClose: () => void;
};

type Visibility = "PUBLIC" | "FOLLOWERS";

export default function CreateStory({ onClose }: CreateStoryProps) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>("FOLLOWERS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setError("");

    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Please select an image or video.");
      return;
    }

    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError(
        isImage
          ? "Images must be 10 MB or smaller."
          : "Videos must be 50 MB or smaller.",
      );
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image or video first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const authResponse = await fetch("/api/upload-auth");

      if (!authResponse.ok) {
        throw new Error("Unable to authenticate your upload.");
      }

      const { signature, expire, token, publicKey } =
        await authResponse.json();

      const uploadResponse = await upload({
        signature,
        expire,
        token,
        publicKey,
        file,
        fileName: file.name,
        folder: "/stories",
      });

      const mediaType = file.type.startsWith("image/")
        ? "IMAGE"
        : "VIDEO";

      const mediaUrl = uploadResponse.filePath;

      if (!mediaUrl) {
        throw new Error("ImageKit did not return a media file path.");
      }

      const result = await createStory(
        mediaUrl,
        mediaType,
        visibility,
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Story upload failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while uploading your story.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-background text-foreground p-5 space-y-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Story</h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 cursor-pointer min-h-48">
          {preview ? (
            file?.type.startsWith("video/") ? (
              <video
                src={preview}
                controls
                className="max-h-64 max-w-full rounded-lg"
              />
            ) : (
              <img
                src={preview}
                alt="Story preview"
                className="max-h-64 max-w-full rounded-lg object-contain"
              />
            )
          ) : (
            <>
              <ImagePlus size={40} />
              <span>Select an image or video</span>
              <span className="text-sm text-muted-foreground">
                Image: up to 10 MB · Video: up to 50 MB
              </span>
            </>
          )}

          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>

        <div className="space-y-2">
          <p className="font-medium">Who can view your story?</p>

          <select
            value={visibility}
            onChange={(event) =>
              setVisibility(event.target.value as Visibility)
            }
            disabled={loading}
            className="w-full rounded-lg border bg-background p-3"
          >
            <option value="FOLLOWERS">Followers Only</option>
            <option value="PUBLIC">Public</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground p-3 font-medium disabled:opacity-50"
        >
          <Upload size={18} />
          {loading ? "Uploading..." : "Share Story"}
        </button>
      </div>
    </div>
  );
}
