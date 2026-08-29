package com.donateconnect.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

@Slf4j
@Component
public class DatabaseHealthCheck implements CommandLineRunner {

    @Autowired
    private DataSource dataSource;

    @Override
    public void run(String... args) {
        log.info("Checking PostgreSQL database connection...");
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            log.info("==================================================================");
            log.info("[DATABASE CHECK SUCCESS] JPA successfully connected to PostgreSQL!");
            log.info("Database Product Name : {}", metaData.getDatabaseProductName());
            log.info("Database Version      : {}", metaData.getDatabaseProductVersion());
            log.info("Database URL          : {}", metaData.getURL());
            log.info("Database Driver       : {}", metaData.getDriverName());
            log.info("==================================================================");
        } catch (Exception e) {
            log.error("==================================================================");
            log.error("[DATABASE CHECK FAILURE] Failed to connect to PostgreSQL database!");
            log.error("Error Message : {}", e.getMessage());
            log.error("Please verify your DB_URL, DB_USERNAME, and DB_PASSWORD environment variables.");
            log.error("==================================================================");
        }
    }
}
