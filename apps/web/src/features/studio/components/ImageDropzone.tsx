import { useId, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ImageUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, validateUploadFile } from "@/features/images/upload-validation";

type ImageDropzoneProps = {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
};

export function ImageDropzone({ onFileAccepted, disabled = false }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const result = validateUploadFile(file);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    onFileAccepted(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFile(event.dataTransfer.files[0]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={error ? errorId : undefined}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-72 flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/60 hover:bg-muted/40",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span className="rounded-full bg-primary/15 p-4 text-primary">
          <ImageUp className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <p className="font-medium">Drop a product photo or click to browse</p>
          <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG or WebP · up to 10 MB</p>
        </div>
      </div>
      {/* Kept outside the role="button" div so its own click doesn't bubble back and reopen the picker. */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload product photo"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
