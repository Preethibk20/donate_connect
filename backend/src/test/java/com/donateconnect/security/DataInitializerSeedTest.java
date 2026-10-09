package com.donateconnect.security;

import com.donateconnect.config.DataInitializer;
import com.donateconnect.repository.*;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {"app.seed.enabled=true", "SEED_PASSWORD=test123"})
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
    void testDataInitializerIsAbsentWhenExplicitlyFalse() {
        assertNull(dataInitializer, "DataInitializer bean should NOT exist when app.seed.enabled is false");
    }
}

class DataInitializerPropertyUnsetTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withBean(UserRepository.class, () -> Mockito.mock(UserRepository.class))
            .withBean(NGOProfileRepository.class, () -> Mockito.mock(NGOProfileRepository.class))
            .withBean(DonationRepository.class, () -> Mockito.mock(DonationRepository.class))
            .withBean(StatusHistoryRepository.class, () -> Mockito.mock(StatusHistoryRepository.class))
            .withBean(DonationCommentRepository.class, () -> Mockito.mock(DonationCommentRepository.class))
            .withBean(NgoRatingRepository.class, () -> Mockito.mock(NgoRatingRepository.class))
            .withBean(NgoUrgentNeedRepository.class, () -> Mockito.mock(NgoUrgentNeedRepository.class))
            .withBean(VolunteerTaskRepository.class, () -> Mockito.mock(VolunteerTaskRepository.class))
            .withBean(CorporateDriveRepository.class, () -> Mockito.mock(CorporateDriveRepository.class))
            .withBean(SmartLockerRepository.class, () -> Mockito.mock(SmartLockerRepository.class))
            .withBean(BlockchainBlockRepository.class, () -> Mockito.mock(BlockchainBlockRepository.class))
            .withBean(NgoResourceTradeRepository.class, () -> Mockito.mock(NgoResourceTradeRepository.class))
            .withBean(DeliveryRepository.class, () -> Mockito.mock(DeliveryRepository.class))
            .withBean(PasswordEncoder.class, () -> Mockito.mock(PasswordEncoder.class))
            .withUserConfiguration(DataInitializer.class);

    @Test
    void testDataInitializerIsAbsentWhenPropertyNotSetAtAll() {
        // Run with zero property sources - no .env, no test profile, no app.seed.enabled property set
        contextRunner.run(context -> {
            assertThat(context).doesNotHaveBean(DataInitializer.class);
        });
    }

    @Test
    void testDataInitializerIsPresentWhenPropertyIsTrue() {
        contextRunner.withPropertyValues("app.seed.enabled=true", "SEED_PASSWORD=test123").run(context -> {
            assertThat(context).hasSingleBean(DataInitializer.class);
        });
    }

    @Test
    void testDataInitializerIsAbsentWhenPropertyIsFalse() {
        contextRunner.withPropertyValues("app.seed.enabled=false").run(context -> {
            assertThat(context).doesNotHaveBean(DataInitializer.class);
        });
    }
}


