import multer from 'multer';
import { env } from '../config/env.js';

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1, fields: 4 },
  fileFilter: (_request, file, callback) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    callback(null, ['pdf','docx','pptx','txt'].includes(extension ?? ''));
  }
}).single('file');
