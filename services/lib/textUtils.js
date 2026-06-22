/**
 * @description Utility class for common text transformations
 */
class TextUtils {

  /**
   * @description Converts a string to a URL-friendly slug
   * @param {String} text - Input text
   * @returns {String} Lowercased, hyphen-separated string with non-word characters removed
   */
  toUrlFriendly(text) {
    return (text || '').toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }

}

export default new TextUtils();