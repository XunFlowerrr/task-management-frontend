import React, { useEffect } from "react"; // Import useEffect
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image"; // Use Next.js Image for optimization if applicable

interface AttachmentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl: string | null;
  fileName: string | null;
  fileType: string | null;
}

const isImage = (type: string | null) => type?.startsWith("image/");
const isVideo = (type: string | null) => type?.startsWith("video/");
const isPdf = (type: string | null) => type === "application/pdf";

export const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
  isOpen,
  onClose,
  previewUrl,
  fileName,
  fileType,
}) => {
  // Log the URL when the modal intends to open with a valid URL
  useEffect(() => {
    if (isOpen && previewUrl) {
      console.log("AttachmentPreviewModal attempting to load URL:", previewUrl);
    }
  }, [isOpen, previewUrl]);

  if (!isOpen || !previewUrl || !fileName || !fileType) {
    return null;
  }

  const handleMediaError = (
    event: React.SyntheticEvent<
      HTMLImageElement | HTMLVideoElement | HTMLIFrameElement,
      Event
    >
  ) => {
    console.error("Error loading media in preview modal:", event);
    // Optionally: Display a specific error message to the user within the modal
    alert(
      `Preview failed to load for ${fileName}. The resource might be unavailable or blocked.`
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="truncate">{fileName}</DialogTitle>
          <DialogDescription>{fileType}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20">
          {/* Render content based on type */}
          {isImage(fileType) ? (
            <Image
              src={previewUrl} // Signed URL works directly here
              alt={`Preview of ${fileName}`}
              width={800} // Adjust initial width hint
              height={600} // Adjust initial height hint
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                height: "auto", // Maintain aspect ratio
                width: "auto", // Maintain aspect ratio
                objectFit: "contain",
              }}
              onError={handleMediaError} // Add error handler
            />
          ) : isVideo(fileType) ? (
            <video
              src={previewUrl} // Signed URL works directly here
              controls
              style={{ maxWidth: "100%", maxHeight: "100%" }}
              preload="metadata"
              onError={handleMediaError} // Add error handler
            >
              Your browser does not support the video tag.
            </video>
          ) : isPdf(fileType) ? (
            <iframe
              src={previewUrl} // Signed URL works directly here
              title={`Preview of ${fileName}`}
              style={{ width: "100%", height: "100%", minHeight: "70vh" }} // Ensure enough height
              frameBorder="0"
              onError={handleMediaError} // Add error handler (might not work reliably on all browsers for iframe)
            />
          ) : (
            <div className="text-center text-muted-foreground p-8">
              Preview not available for this file type ({fileType}). You can
              still download it.
            </div>
          )}
        </div>
        {/* Optional Footer */}
        {/* <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};
