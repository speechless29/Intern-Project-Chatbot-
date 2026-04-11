import * as pdfjsLib from "pdfjs-dist";
import { uploadPDFToStorage, saveFileRecord } from "./storageService";

// Set up the worker for PDF.js using local public worker
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

export async function extractTextFromPDF(file) {
  if (!file) {
    throw new Error("No file provided");
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

export async function processAndUploadPDF(file, userId, aiService) {
  if (!file || !userId) {
    throw new Error("File and user ID are required");
  }

  // Upload file to Supabase Storage
  const uploadResult = await uploadPDFToStorage(file, userId);

  // Extract text from PDF
  const pdfText = await extractTextFromPDF(file);

  // Save file record to database
  const fileRecord = await saveFileRecord(
    userId,
    file.name,
    uploadResult.path,
    file.size,
  );

  // Generate summary with AI
  const summary = await generatePDFSummary(pdfText, aiService);

  return {
    fileRecord,
    summary,
    text: pdfText,
  };
}

export async function generatePDFSummary(pdfText, aiService) {
  if (!pdfText || pdfText.trim().length === 0) {
    throw new Error("No text extracted from PDF");
  }

  const summaryPrompt = `Please provide a concise summary of the following document. Focus on key points and main ideas:

${pdfText}

Summary:`;

  const response = await aiService(summaryPrompt, []);
  let fullResponse = "";

  for await (const chunk of response) {
    fullResponse += chunk;
  }

  return fullResponse;
}
