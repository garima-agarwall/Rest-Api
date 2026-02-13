import multer from 'multer';

// Configure multer for file uploads
// Export as a named export so `import { upload } from '../util/upload.js'` works.
export const upload = multer({
  dest: 'public/images/', // Directory to save uploaded files
});

// Keep default export for flexibility (optional)
export default upload;
