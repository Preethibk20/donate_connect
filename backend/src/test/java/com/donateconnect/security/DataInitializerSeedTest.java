package com.donateconnect.security;

import com.donateconnect.config.DataInitializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "app.seed.enabled=true")
public class DataInitializerSeedTest {

    @Autowired(required = false)
    private DataInitializer dataInitializer;

    @Test
    void testDataInitializerIsPresentWhenEnabled() {
        assertNotNull(dataInitializer, "DataInitializer bean should exist when app.seed.enabled is true");
    }
}

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "app.seed.enabled=false")
class DataInitializerDisabledSeedTest {

    @Autowired(required = false)
    private DataInitializer dataInitializer;

    @Test
    void testDataInitializerIsAbsentWhenUnset() {
        org.junit.jupiter.api.Assertions.assertNull(dataInitializer, "DataInitializer bean should NOT exist when app.seed.enabled is false");
    }
}
