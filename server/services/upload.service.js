const ImageKit = require('imagekit');
const crypto = require('crypto');

/**
 * ImageKit service for image uploads
 * Uses client-side upload with server-side authentication
 */

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

/**
 * Generate authentication parameters for client-side upload
 * @returns {Object} Authentication parameters (token, expire, signature)
 */
exports.getAuthenticationParameters = () => {
  try {
    // Generate a unique token for every upload authentication request
    const token = crypto.randomUUID();

    // Expire in 30 minutes
    const expire = Math.floor(Date.now() / 1000) + 30 * 60;

    // ImageKit signature = HMAC-SHA1(token + expire)
    const signature = crypto
      .createHmac('sha1', process.env.IMAGEKIT_PRIVATE_KEY)
      .update(token + expire)
      .digest('hex');

    return {
      success: true,
      data: {
        token,
        expire,
        signature,
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
      }
    };
  } catch (error) {
    console.error('Error generating ImageKit auth params:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete an image from ImageKit (for cleanup)
 * @param {string} fileId - ImageKit file ID
 * @returns {Promise<Object>} Deletion result
 */
exports.deleteImage = async (fileId) => {
  try {
    await imagekit.deleteFile(fileId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting image from ImageKit:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get image URL with transformations
 * @param {string} path - Image path in ImageKit
 * @param {Object} transformations - ImageKit transformations
 * @returns {string} Transformed image URL
 */
exports.getTransformedUrl = (path, transformations = {}) => {
  return imagekit.url({
    path,
    transformation: [transformations]
  });
};