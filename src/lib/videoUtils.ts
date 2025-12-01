/**
 * Video URL utilities for handling different video sources
 * Supports: Direct video files, Google Drive, Loom, Dropbox, OneDrive, etc.
 */

export interface VideoInfo {
  type: 'direct' | 'google-drive' | 'loom' | 'external';
  url: string;
  embedUrl?: string;
  canEmbed: boolean;
}

/**
 * Convert Google Drive share link to embeddable URL
 * Input: https://drive.google.com/file/d/FILE_ID/view?usp=...
 * Output: https://drive.google.com/file/d/FILE_ID/preview
 */
export function convertGoogleDriveUrl(url: string): string | null {
  // Pattern 1: /file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) {
    return `https://drive.google.com/file/d/${match1[1]}/preview`;
  }
  
  // Pattern 2: /open?id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) {
    return `https://drive.google.com/file/d/${match2[1]}/preview`;
  }
  
  return null;
}

/**
 * Check if URL is a Google Drive link
 */
export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com');
}

/**
 * Check if URL is a Loom link
 */
export function isLoomUrl(url: string): boolean {
  return url.includes('loom.com');
}

/**
 * Check if URL is a direct video file
 */
export function isDirectVideoUrl(url: string): boolean {
  // Cloudinary or other CDN URLs
  if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    return true;
  }
  
  // Direct video file extensions
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.ogv'];
  const urlLower = url.toLowerCase();
  return videoExtensions.some(ext => urlLower.includes(ext));
}

/**
 * Check if URL is Dropbox
 */
export function isDropboxUrl(url: string): boolean {
  return url.includes('dropbox.com');
}

/**
 * Check if URL is OneDrive/SharePoint
 */
export function isOneDriveUrl(url: string): boolean {
  return url.includes('1drv.ms') || 
         url.includes('onedrive.live.com') || 
         url.includes('sharepoint.com');
}

/**
 * Analyze video URL and return detailed info
 */
export function analyzeVideoUrl(url: string): VideoInfo {
  if (!url) {
    return {
      type: 'external',
      url: '',
      canEmbed: false,
    };
  }
  
  // Direct video files (Cloudinary, direct URLs)
  if (isDirectVideoUrl(url)) {
    return {
      type: 'direct',
      url,
      canEmbed: true,
    };
  }
  
  // Google Drive
  if (isGoogleDriveUrl(url)) {
    const embedUrl = convertGoogleDriveUrl(url);
    return {
      type: 'google-drive',
      url,
      embedUrl: embedUrl || url,
      canEmbed: true,
    };
  }
  
  // Loom
  if (isLoomUrl(url)) {
    return {
      type: 'loom',
      url,
      canEmbed: false, // Loom videos shown as external links
    };
  }
  
  // Other external links (Dropbox, OneDrive, etc.)
  return {
    type: 'external',
    url,
    canEmbed: false,
  };
}

/**
 * Get display name for video source
 */
export function getVideoSourceName(videoInfo: VideoInfo): string {
  switch (videoInfo.type) {
    case 'direct':
      return 'Video';
    case 'google-drive':
      return 'Google Drive Video';
    case 'loom':
      return 'Loom Video';
    case 'external':
      if (isDropboxUrl(videoInfo.url)) return 'Dropbox Video';
      if (isOneDriveUrl(videoInfo.url)) return 'OneDrive Video';
      return 'External Video';
    default:
      return 'Video';
  }
}
