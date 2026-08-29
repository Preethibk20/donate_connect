package com.donateconnect;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class DonateConnectApplication {

    @Autowired
    private Environment env;

    public static void main(String[] args) {
        SpringApplication.run(DonateConnectApplication.class, args);
    }

    @PostConstruct
    public void validateEnv() {
        String jwtSecret = env.getProperty("app.jwt.secret");
        if (jwtSecret == null || jwtSecret.trim().isEmpty() || jwtSecret.equals("${JWT_SECRET}")) {
            throw new IllegalStateException(
                "FATAL STARTUP ERROR: The application property 'app.jwt.secret' (JWT_SECRET environment variable) must be set for secure operations. Failing startup now."
            );
        }
    }
}
