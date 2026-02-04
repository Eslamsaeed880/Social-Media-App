import { v2 } from 'cloudinary';
import config from '../config/config.js';

v2.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
});

export const uploadToCloudinary = async (filePath, folder) => {
    try {
        const result = await v2.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto',
        });

        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error('Failed to upload Media to Cloudinary');
    }
}

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        const result = await v2.uploader.destroy(publicId, {
            resource_type: resourceType,
        });

        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw new Error('Failed to delete Media from Cloudinary');
    }
}
