
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Camera, ImagePlus } from "lucide-react";
import { upload } from "@imagekit/next";
import ImageComp from "./ImageComp";
import { updateProfile } from "@/actions/updateProfile";

type EditProfileProps = {
  user: {
    displayName: string | null;
    username: string;
    bio: string | null;
    location: string | null;
    job: string | null;
    img: string | null;
    cover: string | null;
  };
};

const EditProfile = ({ user }: EditProfileProps) => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || "");
  const [location, setLocation] = useState(user.location || "");
  const [job, setJob] = useState(user.job || "");

  const [avatar, setAvatar] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  // Clean up temporary preview URLs.
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [avatarPreview, coverPreview]);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover"
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be smaller than 5MB.");
      e.target.value = "";
      return;
    }

    setError("");

    const preview = URL.createObjectURL(file);

    if (type === "avatar") {
      setAvatar(file);
      setAvatarPreview(preview);
    } else {
      setCover(file);
      setCoverPreview(preview);
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    const response = await fetch("/api/upload-auth");

    if (!response.ok) {
      throw new Error("Could not authenticate image upload.");
    }

    const { signature, expire, token, publicKey } =
      await response.json();

    const uploadedFile = await upload({
      file,
      fileName: file.name,
      folder,
      signature,
      expire,
      token,
      publicKey,
    });

    return uploadedFile.filePath as string;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsPending(true);

    try {
      let img = user.img || undefined;
      let coverImage = user.cover || undefined;

      // Upload only images that the user has changed.
      if (avatar) {
        img = await uploadImage(avatar, "/profiles/avatars");
      }

      if (cover) {
        coverImage = await uploadImage(cover, "/profiles/covers");
      }

      const result = await updateProfile({
        displayName,
        username,
        bio,
        location,
        job,
        img,
        cover: coverImage,
      });

      if (!result.success) {
        setError(result.error || "Could not update profile.");
        return;
      }

      setIsOpen(false);
      router.push(`/${result.username}`);
      router.refresh();
    } catch (err) {
      console.error("Edit profile error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  const closeModal = () => {
    if (isPending) return;

    setIsOpen(false);
    setError("");
    setAvatar(null);
    setCover(null);
    setAvatarPreview("");
    setCoverPreview("");

    setDisplayName(user.displayName || "");
    setUsername(user.username);
    setBio(user.bio || "");
    setLocation(user.location || "");
    setJob(user.job || "");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="border border-gray-400 rounded-full px-4 py-2 text-sm font-semibold hover:bg-gray-100 hover:text-black transition"
      >
        Edit profile
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-foreground text-background w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit profile</h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                aria-label="Close edit profile"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Cover photo */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Cover photo
                </label>

                <div className="relative h-36 w-full rounded-xl overflow-hidden bg-gray-300">
                  {coverPreview ? (
                    <Image
                      src={coverPreview}
                      alt="Cover preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : user.cover ? (
                    <ImageComp
                      src={user.cover}
                      alt="Cover"
                      w={600}
                      h={144}
                      className="w-full h-full object-cover"
                    />
                  ) : null}

                  <label
                    htmlFor="cover-upload"
                    className="absolute bottom-3 right-3 bg-black/60 text-white p-2 rounded-full cursor-pointer"
                  >
                    <ImagePlus size={20} />
                  </label>

                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, "cover")}
                  />
                </div>
              </div>

              {/* Profile photo */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Profile photo
                </label>

                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-300">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Avatar preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <ImageComp
                      src={user.img || "general/noAvatar.png"}
                      alt="Avatar"
                      w={96}
                      h={96}
                      className="w-full h-full object-cover"
                    />
                  )}

                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-1 right-1 bg-black/60 text-white p-1.5 rounded-full cursor-pointer"
                  >
                    <Camera size={16} />
                  </label>

                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, "avatar")}
                  />
                </div>
              </div>

              {/* Display name */}
              <div>
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display name
                </label>
                <input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                  required
                  className="w-full mt-1 p-3 rounded-lg border border-background/30 bg-transparent outline-none focus:border-primary"
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="text-sm font-medium">
                  Username
                </label>
                <div className="flex items-center mt-1 border border-background/30 rounded-lg px-3">
                  <span className="text-background/60">@</span>
                  <input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                    required
                    className="w-full p-3 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className="w-full mt-1 p-3 rounded-lg border border-background/30 bg-transparent outline-none focus:border-primary resize-none"
                />
                <p className="text-xs text-background/60 text-right">
                  {bio.length}/160
                </p>
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={60}
                  className="w-full mt-1 p-3 rounded-lg border border-background/30 bg-transparent outline-none focus:border-primary"
                />
              </div>

              {/* Job */}
              <div>
                <label htmlFor="job" className="text-sm font-medium">
                  Job
                </label>
                <input
                  id="job"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  maxLength={60}
                  className="w-full mt-1 p-3 rounded-lg border border-background/30 bg-transparent outline-none focus:border-primary"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="bg-background text-foreground rounded-full py-3 font-semibold hover:opacity-80 transition disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfile;
