"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Attachment,
  getTaskAttachments,
  uploadAttachment,
  deleteAttachment,
  getAttachmentDownloadUrl,
  getAttachmentPreviewUrl,
  getAttachmentSignedDownloadUrl,
  getSignedUploadUrl,
  uploadFileToGcs,
  createAttachmentRecord,
} from "@/lib/api/attachments";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Link as LinkIcon,
  Eye,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { AttachmentPreviewModal } from "@/components/ui/AttachmentPreviewModal";

interface TaskAttachmentsProps {
  taskId: string;
  token?: string;
}

const canPreviewType = (fileType: string | null): boolean => {
  if (!fileType) return false;
  return ["image/", "video/", "application/pdf"].some((prefix) =>
    fileType.startsWith(prefix)
  );
};

export function TaskAttachments({ taskId, token }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );

  const fetchAttachments = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTaskAttachments(taskId, token);
      const formattedData = data.map((att) => ({
        ...att,
        created_at: att.created_at || att.uploaded_at,
      }));
      setAttachments(formattedData);
    } catch (err) {
      console.error("Failed to fetch attachments:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load attachments"
      );
      toast.error("Failed to load attachments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [taskId, token]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !token) {
      toast.error("Please select a file to upload.");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      // 1. Get signed upload URL from backend
      const { url, gcsFileName } = await getSignedUploadUrl(
        taskId,
        selectedFile.name,
        selectedFile.type,
        token
      );
      // 2. Upload file directly to GCS
      const uploadRes = await uploadFileToGcs(url, selectedFile);
      if (!uploadRes.ok) throw new Error("Failed to upload file to storage.");
      // 3. Notify backend to create attachment record
      await createAttachmentRecord(
        {
          taskId,
          fileName: selectedFile.name,
          gcsFileName,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        },
        token
      );
      toast.success(`Attachment "${selectedFile.name}" uploaded successfully.`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      fetchAttachments();
    } catch (err) {
      console.error("Failed to upload attachment:", err);
      toast.error(
        `Failed to upload attachment: ${
          err instanceof Error ? err.message : "Upload Error"
        }`
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteClick = (attachmentId: string) => {
    setDeletingAttachmentId(attachmentId);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAttachmentId || !token) return;

    try {
      await deleteAttachment(deletingAttachmentId, token);
      toast.success("Attachment deleted successfully.");
      fetchAttachments();
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      toast.error(
        `Failed to delete attachment: ${
          err instanceof Error ? err.message : "Error"
        }`
      );
    } finally {
      setDeletingAttachmentId(null);
      setDeleteAlertOpen(false);
    }
  };

  const handlePreviewClick = (attachment: Attachment) => {
    if (canPreviewType(attachment.file_type)) {
      setPreviewAttachment(attachment);
      setIsPreviewModalOpen(true);
    } else {
      toast.info("Preview is not available for this file type.");
    }
  };

  const handleDownload = async (attachmentId: string, fileName: string) => {
    try {
      const url = await getAttachmentSignedDownloadUrl(attachmentId, token);
      // Create a temporary link and click it to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error(
        `Failed to get download link: ${
          err instanceof Error ? err.message : "Error"
        }`
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>
          Manage files and links attached to this task.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading attachments...</p>}
        {error && <p className="text-destructive">Error: {error}</p>}
        {!isLoading && !error && attachments.length === 0 && (
          <p className="text-muted-foreground text-sm">No attachments yet.</p>
        )}
        {!isLoading && !error && attachments.length > 0 && (
          <ul className="space-y-3">
            {attachments.map((att) => {
              const isPreviewable = canPreviewType(att.file_type);
              return (
                <li
                  key={att.attachment_id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {att.file_type === "link" ? (
                      <LinkIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      {att.file_type === "link" && att.file_url ? (
                        <Link
                          href={att.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline truncate block"
                        >
                          {att.file_name ||
                            att.attachment_name ||
                            "Link Attachment"}
                        </Link>
                      ) : (
                        <span className="font-medium truncate block">
                          {att.file_name || "File Attachment"}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added:{" "}
                        {formatDate(att.created_at || att.uploaded_at, "PPp")}
                        {att.file_type !== "link" && att.file_size
                          ? ` (${(att.file_size / 1024 / 1024).toFixed(2)} MB)`
                          : ""}
                        {att.file_type !== "link"
                          ? ` (${att.file_type})`
                          : " (Link)"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {att.file_type !== "link" && isPreviewable && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreviewClick(att)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Preview</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleDownload(att.attachment_id, att.file_name)
                      }
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(att.attachment_id)}
                      disabled={!!deletingAttachmentId}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <form onSubmit={handleFileUpload} className="w-full space-y-3">
          <Label htmlFor="fileUpload" className="text-sm font-medium">
            Add New Attachment (File)
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="fileUpload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="flex-1"
              disabled={isUploading}
            />
            <Button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="sm:ml-2"
            >
              {isUploading ? (
                "Uploading..."
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload File
                </>
              )}
            </Button>
          </div>
          {isUploading && (
            <Progress value={uploadProgress} className="w-full h-2" />
          )}
          {selectedFile && !isUploading && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name}
            </p>
          )}
        </form>
      </CardFooter>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              attachment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAttachmentId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AttachmentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        previewUrl={
          previewAttachment
            ? getAttachmentPreviewUrl(previewAttachment.attachment_id)
            : null
        }
        fileName={previewAttachment?.file_name ?? null}
        fileType={previewAttachment?.file_type ?? null}
      />
    </Card>
  );
}
