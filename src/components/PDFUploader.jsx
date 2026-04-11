import React, { useState } from "react";
import { Upload, FileText, X, Loader } from "lucide-react";

export default function PDFUploader({ onUpload, isLoading }) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setFileName(file.name);
    onUpload(file);
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="mb-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleInputChange}
          className="hidden"
          id="pdf-upload"
          disabled={isLoading}
        />

        <label
          htmlFor="pdf-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader size={32} className="text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Processing PDF...</p>
            </>
          ) : fileName ? (
            <>
              <FileText size={32} className="text-blue-500 mb-2" />
              <p className="text-sm font-semibold text-gray-800">{fileName}</p>
              <p className="text-xs text-gray-500 mt-1">Click to change file</p>
            </>
          ) : (
            <>
              <Upload size={32} className="text-gray-400 mb-2" />
              <p className="text-sm font-semibold text-gray-700">
                Drag PDF here or click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
            </>
          )}
        </label>
      </div>
    </div>
  );
}
