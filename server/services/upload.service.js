const ImageKit = require('imagekit');

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
    const authParams = imagekit.getAuthenticationParameters();
    return {
      success: true,
      data: {
        token: authParams.token,
        expire: authParams.expire,
        signature: authParams.signature,
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
