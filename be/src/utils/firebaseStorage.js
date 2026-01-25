import { storage } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file buffer to Firebase Storage and returns the public URL.
 * @param {Buffer} fileBuffer - The file content as a buffer.
 * @param {string} originalName - The original name of the file to determine extension.
 * @param {string} folder - The folder in the bucket (e.g., 'avatars').
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
export const uploadToFirebase = async (fileBuffer, originalName, folder = 'avatars') => {
    if (!storage) {
        throw new Error('Firebase Storage is not initialized');
    }

    const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const extension = originalName.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${extension}`;
    const file = bucket.file(fileName);

    await file.save(fileBuffer, {
        metadata: {
            contentType: `image/${extension === 'png' ? 'png' : 'jpeg'}`, // Simple mapping, can be improved
        },
    });

    // Make the file public or use signed URLs. 
    // For avatars, public access is usually fine if configured in the bucket.
    // Alternatively, return a URL that follows the standard Firebase Storage pattern:
    // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[PATH]?alt=media

    const encodedPath = encodeURIComponent(fileName);
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

    return publicUrl;
};
