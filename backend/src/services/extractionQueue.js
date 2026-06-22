const { extractCareerDocFields } = require('./careerDocExtractor');

// Pragmatic simplification: Using a single-process, in-memory queue rather than a 
// distributed queue like Redis/Bull. This is sufficient for current scale and 
// prevents immediate rate-limiting issues when users bulk-upload career documents.
const queue = [];
let isProcessing = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processQueue() {
  if (isProcessing || queue.length === 0) return;

  isProcessing = true;

  while (queue.length > 0) {
    const job = queue.shift();

    try {
      const result = await extractCareerDocFields(job.fileBuffer, job.mimetype, job.category);
      job.resolve(result);
    } catch (error) {
      job.reject(error);
    }

    // Add a small delay between processing each queued item to comfortably stay under rate limits
    if (queue.length > 0) {
      await delay(300);
    }
  }

  isProcessing = false;
}

/**
 * Adds an extraction job to the queue and returns a Promise that resolves 
 * when the extraction for this specific job is completed.
 */
function queueExtraction(fileBuffer, mimetype, category) {
  return new Promise((resolve, reject) => {
    queue.push({
      fileBuffer,
      mimetype,
      category,
      resolve,
      reject
    });

    // Fire and forget; if it's already processing, it will just pick this up in the loop
    processQueue();
  });
}

module.exports = {
  queueExtraction
};
