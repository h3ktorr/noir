"use server";

import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_PUBLIC_KEY!,
  privateKey: process.env.PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_URL_ENDPOINT!,
});

export async function fetchPost() {
  try {
    const files = await imagekit.listFiles({
      path: "/posts", // 👈 your folder
    });

    console.log(files);

    return files;
  } catch (error) {
    console.error(error);
    return [];
  }
}
