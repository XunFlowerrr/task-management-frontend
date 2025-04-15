import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface Attachment {
  attachment_id: string;
  task_id: string;
  file_name: string; // Original filename
  file_path: string; // GCS object name (or URL for 'link' type)
  file_type: string; // MIME type or 'link'
  file_size: number | null; // Size might be null for links
  uploaded_at: string; // Keep original name for consistency? DB uses created_at
  created_at: string; // Added based on DB schema often having this
  // file_url is specific to 'link' type attachments now
  file_url?: string | null; // Make optional as it's only for links
  // download_url is generated on demand by the backend /download endpoint
}

export interface CreateAttachmentData {
  attachmentName: string;
  taskId: string;
  file_url: string; // Only used for creating 'link' type
  file_type: string; // Should be 'link'
}

export interface UpdateAttachmentData {
  attachmentName?: string;
  file_url?: string;
  file_type?: string;
}

/**
 * Create a new attachment for a task
 */
export async function createAttachment(data: CreateAttachmentData, token?: string): Promise<{ message: string; attachmentId: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/attachments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create attachment");
  }

  return response.json();
}

/**
 * Upload a new attachment file for a task
 */
export async function uploadAttachment(
  taskId: string,
  formData: FormData, // Expects FormData containing the file
  token?: string
): Promise<{ message: string; attachment: Attachment }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  // Ensure taskId is included in the FormData if required by the backend
  if (!formData.has("taskId")) {
    formData.append("taskId", taskId);
  }

  const response = await fetch(`${API_URL}/attachments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Content-Type is set automatically by browser for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`Failed to upload attachment: ${response.status} ${response.statusText}`);
    }
    throw new Error(errorData?.error || `Failed to upload attachment: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (uploadAttachment):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Get all attachments for a specific task
 */
export async function getTaskAttachments(taskId: string, token?: string): Promise<Attachment[]> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/attachments?taskId=${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch attachments");
  }

  return response.json();
}

/**
 * Get all attachments across all tasks the user has access to
 */
export async function getAllAttachments(token?: string): Promise<Attachment[]> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/attachments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch attachments");
  }

  return response.json();
}

/**
 * Get a specific attachment by ID
 */
export async function getAttachment(id: string, token?: string): Promise<Attachment> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/attachments/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch attachment");
  }

  return response.json();
}

/**
 * Update an attachment
 */
export async function updateAttachment(id: string, data: UpdateAttachmentData, token?: string): Promise<{ message: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/attachments/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update attachment");
  }

  return response.json();
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(attachmentId: string, token?: string): Promise<{ message: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`Failed to delete attachment: ${response.status} ${response.statusText}`);
    }
    throw new Error(errorData?.error || `Failed to delete attachment: ${response.status} ${response.statusText}`);
  }

  // Handle potential 204 No Content response which might not have a body
  if (response.status === 204) {
    return { message: "Attachment deleted successfully" };
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (deleteAttachment):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Helper function to get the download URL for an attachment
 * This URL points to our backend, which then provides the actual file or redirects.
 */
export function getAttachmentDownloadUrl(attachmentId: string): string {
  return `${API_URL}/attachments/${attachmentId}/download`;
}

/**
 * Helper function to get the PREVIEW URL for an attachment (for inline display)
 * This URL points to our backend, requesting inline disposition.
 */
export function getAttachmentPreviewUrl(attachmentId: string): string {
  return `${API_URL}/attachments/${attachmentId}/download?inline=true`;
}

/**
 * Get a signed download URL for an attachment (returns { url })
 */
export async function getAttachmentSignedDownloadUrl(attachmentId: string, token?: string): Promise<string> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }
  const response = await fetch(`${API_URL}/attachments/${attachmentId}/signed-url`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get signed download URL");
  }
  const data = await response.json();
  return data.url;
}

/**
 * Request a signed upload URL from the backend for direct-to-GCS upload
 */
export async function getSignedUploadUrl(taskId: string, fileName: string, fileType: string, token?: string): Promise<{ url: string; gcsFileName: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }
  const response = await fetch(`${API_URL}/attachments/signed-upload-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskId, fileName, fileType }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get signed upload URL");
  }
  return response.json();
}

/**
 * Upload a file directly to GCS using the signed URL
 */
export async function uploadFileToGcs(signedUrl: string, file: File): Promise<Response> {
  return fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "Content-Length": file.size.toString(),
    },
    body: file,
  });
}

/**
 * Notify backend of the uploaded file (create attachment metadata)
 */
export async function createAttachmentRecord({
  taskId,
  fileName,
  gcsFileName,
  fileType,
  fileSize,
}: {
  taskId: string;
  fileName: string;
  gcsFileName: string;
  fileType: string;
  fileSize: number;
}, token?: string): Promise<{ message: string; attachmentId: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }
  const response = await fetch(`${API_URL}/attachments/record`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId,
      fileName,
      fileType,
      gcsFileName,
      fileSize,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create attachment record");
  }
  return response.json();
}

// If you decide to implement inline previews differently later (e.g., separate endpoint or query param):
// export function getAttachmentPreviewUrl(attachmentId: string): string {
//   return `${API_URL}/attachments/${attachmentId}/preview`; // or `${API_URL}/attachments/${attachmentId}/download?inline=true`
// }
