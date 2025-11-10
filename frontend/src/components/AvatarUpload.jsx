/**
 * Avatar Upload Component
 *
 * Story 8.2: Simple avatar upload with preview
 * - File selection
 * - Image preview
 * - Upload/Delete functionality
 */

import React, { useState } from 'react';
import apiService from '../services/api';

function AvatarUpload({ currentAvatarUrl, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await apiService.user.uploadAvatar(formData);

      // Success
      setSelectedFile(null);
      setPreviewUrl(null);
      if (onUploadSuccess) {
        onUploadSuccess(response.data.data.avatarUrl);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your avatar?')) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      await apiService.user.deleteAvatar();

      // Success
      if (onUploadSuccess) {
        onUploadSuccess(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.error || 'Failed to delete avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {previewUrl ? (
        // Show preview and upload button
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Preview:</strong>
            <div
              style={{
                marginTop: '0.5rem',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #ddd',
              }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // Show file selection buttons
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label className="btn btn-primary" style={{ marginBottom: 0, cursor: 'pointer' }}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            Choose Avatar
          </label>

          {currentAvatarUrl && (
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={uploading}
            >
              {uploading ? 'Deleting...' : 'Delete Current Avatar'}
            </button>
          )}
        </div>
      )}

      <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
        Accepted formats: JPEG, PNG, GIF, WebP (max 5MB)
      </div>
    </div>
  );
}

export default AvatarUpload;
