import { supabase } from "./supabaseClient";

// Upload PDF to Supabase Storage
export async function uploadPDFToStorage(file, userId) {
  if (!file || !userId) {
    throw new Error("File and user ID are required");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("pdf-files")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return data;
}

// Get public URL for uploaded PDF
export async function getPDFUrl(filePath) {
  const { data } = supabase.storage.from("pdf-files").getPublicUrl(filePath);

  return data.publicUrl;
}

// Save file record to database
export async function saveFileRecord(userId, fileName, filePath, fileSize) {
  // Get the authenticated user to ensure user_id is in correct format
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("user_files")
    .insert([
      {
        user_id: authData.user.id, // Use the authenticated user's ID directly
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        uploaded_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Get user's uploaded files
export async function getUserFiles(userId) {
  // Get the authenticated user to ensure user_id is in correct format
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("user_files")
    .select("*")
    .eq("user_id", authData.user.id) // Use the authenticated user's ID directly
    .order("uploaded_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

// Delete file from storage and database
export async function deleteFile(fileId, filePath) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("pdf-files")
    .remove([filePath]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("user_files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    throw dbError;
  }
}
