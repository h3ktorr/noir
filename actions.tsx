"use server"

export async function createPostAction(data: FormData) {
  const desc = data.get("desc") as string;
  const file = data.get("file") as File | null;

  console.log(file, desc);
  
}