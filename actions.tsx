"use server"

export async function createPostAction(data: FormData) {
  const file = data.get("file") as File | null;
  
  
}