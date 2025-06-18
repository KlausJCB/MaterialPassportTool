import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, File, X, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  compact?: boolean;
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = "*",
  maxSize = 100,
  title = "Upload File",
  description = "Drag and drop your file here, or click to browse",
  icon,
  disabled = false,
  compact = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type if specified
    if (acceptedTypes !== "*") {
      const allowedTypes = acceptedTypes.split(",").map(type => type.trim());
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!allowedTypes.some(type => 
        type === fileExtension || 
        file.type.match(type.replace("*", ".*"))
      )) {
        return `File type not supported. Accepted types: ${acceptedTypes}`;
      }
    }

    return null;
  };

  const handleFiles = (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        multiple={false}
        className="hidden"
        accept={acceptedTypes}
        onChange={handleChange}
        disabled={disabled}
      />

      {selectedFile && !error ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                  <p className="text-xs text-green-700">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-green-700 hover:text-green-900 hover:bg-green-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg transition-colors ${
            dragActive && !disabled
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${
            compact ? "p-4" : "p-8"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <div className="text-center">
            {icon || <Upload className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400 mx-auto mb-2`} />}
            <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 mb-2`}>
              {title}
            </h4>
            <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mb-4`}>
              {description}
            </p>
            <Button 
              variant={compact ? "outline" : "default"}
              size={compact ? "sm" : "default"}
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                onButtonClick();
              }}
            >
              {compact ? "Browse" : "Select File"}
            </Button>
            {!compact && (
              <p className="text-xs text-gray-400 mt-2">
                {acceptedTypes !== "*" ? `Supports ${acceptedTypes} files` : "All file types supported"} up to {maxSize}MB
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <Alert className="mt-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
