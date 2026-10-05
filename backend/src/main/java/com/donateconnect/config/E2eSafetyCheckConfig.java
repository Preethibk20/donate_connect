package com.donateconnect.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
public class E2eSafetyCheckConfig {

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    private final Environment env;

    public E2eSafetyCheckConfig(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void checkDbIsolation() {
        boolean isE2eOrTest = false;
        for (String profile : env.getActiveProfiles()) {
            if ("e2e".equals(profile) || "test".equals(profile)) {
                isE2eOrTest = true;
                break;
            }
        }

        if (isE2eOrTest) {
            if (dbUrl == null || !dbUrl.startsWith("jdbc:h2:")) {
                throw new IllegalStateException("CRITICAL SECURITY FAILURE: E2E/Test profile is attempting to connect to a non-H2 database! JDBC URL does not start with jdbc:h2:. Stopping application immediately to prevent data corruption.");
            }
        }
    }
}
