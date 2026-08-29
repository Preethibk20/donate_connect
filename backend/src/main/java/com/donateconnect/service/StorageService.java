package com.donateconnect.service;

import java.io.IOException;

/**
 * Abstraction for file storage operations. The default implementation is LocalStorageService
 * which stores files on the local filesystem under app.storage.upload-dir.
 */
public interface StorageService {

    /**
     * Store the given byte data under the given original filename.
     * Returns the relative URL path to serve the file (e.g. "/api/donations/photo/{filename}").
     */
    String store(byte[] data, String originalFilename) throws IOException;

    /**
     * Load file data by its stored filename.
     */
    byte[] load(String filename) throws IOException;

    /**
     * Delete a stored file by filename. Silently ignored if not found.
     */
    void delete(String filename);

    /**
     * Determine the MIME content-type of the stored file by its extension.
     */
    String getContentType(String filename);
}
