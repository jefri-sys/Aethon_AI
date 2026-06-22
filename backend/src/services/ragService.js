const { LocalIndex } = require('vectra');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel(
  { model: 'gemini-embedding-001' },
  { apiVersion: 'v1' }
);

async function extractText(buffer, fileType) {
  try {
    if (fileType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (fileType.startsWith('image/')) {
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      return text;
    } else {
      throw new Error(`Unsupported file type for text extraction: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to extract text from file.');
  }
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  let chunkIndex = 0;
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkTextStr = chunkWords.join(' ');
    
    if (chunkTextStr.trim()) {
      chunks.push({
        text: chunkTextStr,
        chunkIndex
      });
      chunkIndex++;
    }
  }
  return chunks;
}

async function generateEmbedding(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      const isTransientError = error.status === 429 || (error.message && error.message.includes('503 Service Unavailable'));
      if (isTransientError && attempt < retries) {
        console.warn(`[RAG] Transient error (${error.status || 503}) for embedding. Attempt ${attempt}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
        continue;
      }
      throw error;
    }
  }
}

async function indexDocument(buffer, fileType, notebookId, fileName) {
  try {
    console.log(`[RAG] Extracting text from ${fileName}...`);
    const text = await extractText(buffer, fileType);
    
    const chunks = chunkText(text, 500, 50);
    console.log(`[RAG] Chunking text → ${chunks.length} chunks created`);
    
    console.log('[RAG] Generating embeddings...');
    
    const indexPath = path.join(__dirname, '../../data/vectorIndexes', `notebook_${notebookId}`);
    const index = new LocalIndex(indexPath);
    
    if (!await index.isIndexCreated()) {
      await index.createIndex();
    }

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);
      await index.insertItem({
        vector: embedding,
        metadata: {
          notebookId,
          fileName,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text
        }
      });
    }
    
    console.log(`[RAG] Storing in Vectra index notebook_${notebookId}...`);
    console.log(`[RAG] Indexing complete. ${chunks.length} chunks stored.`);
    
    return { success: true, chunksIndexed: chunks.length };
  } catch (error) {
    console.error(`[RAG Error] Indexing failed:`, error);
    throw error;
  }
}

async function queryNotebook(question, notebookId, topK = 5) {
  try {
    console.log('[RAG] Embedding question...');
    const queryEmbedding = await generateEmbedding(question);
    
    const indexPath = path.join(__dirname, '../../data/vectorIndexes', `notebook_${notebookId}`);
    const index = new LocalIndex(indexPath);
    
    if (!await index.isIndexCreated()) {
      return null;
    }
    
    console.log(`[RAG] Retrieving top ${topK} chunks from Vectra...`);
    const results = await index.queryItems(queryEmbedding, topK);
    
    if (!results || results.length === 0) {
      return null;
    }

    const indices = results.map(r => r.item.metadata.chunkIndex);
    console.log(`[RAG] Chunks found: indices ${indices.join(', ')}`);
    console.log('[RAG] Sending assembled prompt to Gemini...');
    
    const excerpts = results.map(r => `[Chunk ${r.item.metadata.chunkIndex}] ${r.item.metadata.text}`).join('\n\n');
    
    const assembledPrompt = `Answer the question using ONLY these excerpts from the student's notes.
Cite the chunk index for each point you make.

Question: ${question}

Excerpts:
${excerpts}

Answer with citations like: (Chunk 1), (Chunk 2)`;

    return assembledPrompt;
  } catch (error) {
    console.error(`[RAG Error] Query failed:`, error);
    throw error;
  }
}

async function deleteNotebookIndex(notebookId) {
  try {
    const indexPath = path.join(__dirname, '../../data/vectorIndexes', `notebook_${notebookId}`);
    await fs.promises.rm(indexPath, { recursive: true, force: true });
    console.log(`[RAG] Deleted index for notebook_${notebookId}`);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`[RAG Error] Could not delete index for notebook_${notebookId}:`, error.message);
    }
  }
}

module.exports = {
  extractText,
  chunkText,
  generateEmbedding,
  indexDocument,
  queryNotebook,
  deleteNotebookIndex
};
