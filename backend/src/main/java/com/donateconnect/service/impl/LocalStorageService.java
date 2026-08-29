package com.donateconnect.service.impl;

import com.donateconnect.service.StorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class LocalStorageService implements StorageService {

    private static final Map<String, String> CONTENT_TYPE_MAP = Map.of(
            "jpg",  "image/jpeg",
            "jpeg", "image/jpeg",
            "png",  "image/png",
            "gif",  "image/gif",
            "webp", "image/webp"
    );

    // Allowed extensions for uploaded files to prevent malicious uploads
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
            "jpg", "jpeg", "png", "gif", "webp"
    );

    private final Path uploadDir;

    public LocalStorageService(@Value("${app.storage.upload-dir:uploads/}") String uploadDirPath) {
        this.uploadDir = Paths.get(uploadDirPath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(uploadDir);
            log.info("Storage directory initialised at: {}", uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + uploadDir, e);
        }
    }

    @Override
    public String store(byte[] data, String originalFilename) throws IOException {
        String extension = getExtension(originalFilename);

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException(
                "File type not allowed: " + extension + ". Only image files (jpg, jpeg, png, gif, webp) are permitted.");
        }

        // Generate a unique filename to prevent collisions and path traversal attacks
        String storedFilename = UUID.randomUUID() + "." + extension.toLowerCase();
        Path filePath = uploadDir.resolve(storedFilename);

        Files.write(filePath, data);
        log.info("Stored file: {}", storedFilename);

        // Return the relative URL used to serve this file
        return "/api/donations/photo/" + storedFilename;
    }

    @Override
    public byte[] load(String filename) throws IOException {
        // Sanitize filename to prevent path traversal
        Path filePath = uploadDir.resolve(sanitizeFilename(filename)).normalize();
        if (!filePath.startsWith(uploadDir)) {
            throw new IllegalArgumentException("Invalid filename (path traversal detected)");
        }
        if (!Files.exists(filePath)) {
            throw new IOException("File not found: " + filename);
        }
        return Files.readAllBytes(filePath);
    }

    @Override
    public void delete(String filename) {
        try {
            Path filePath = uploadDir.resolve(sanitizeFilename(filename)).normalize();
            if (filePath.startsWith(uploadDir)) {
                Files.deleteIfExists(filePath);
                log.info("Deleted file: {}", filename);
            }
        } catch (IOException e) {
            log.warn("Could not delete file {}: {}", filename, e.getMessage());
        }
    }

    @Override
    public String getContentType(String filename) {
        String ext = getExtension(filename).toLowerCase();
        return CONTENT_TYPE_MAP.getOrDefault(ext, "application/octet-stream");
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }

    private String sanitizeFilename(String filename) {
        // Strip any path components, keep only the filename
        return Paths.get(filename).getFileName().toString();
    }
}
