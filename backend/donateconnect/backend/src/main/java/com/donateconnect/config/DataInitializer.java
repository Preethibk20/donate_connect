package com.donateconnect.config;

import com.donateconnect.entity.*;
import com.donateconnect.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final NGOProfileRepository ngoProfileRepository;
    private final DonationRepository donationRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final DonationCommentRepository commentRepository;
    private final NgoRatingRepository ratingRepository;
    private final NgoUrgentNeedRepository urgentNeedRepository;
    private final VolunteerTaskRepository volunteerTaskRepository;
    private final CorporateDriveRepository corporateDriveRepository;
    private final SmartLockerRepository smartLockerRepository;
    private final BlockchainBlockRepository blockchainBlockRepository;
    private final NgoResourceTradeRepository ngoResourceTradeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already contains data. Skipping DataInitializer.");
            return;
        }

        log.info("Seeding Indian NGOs, Users, Volunteers, Corporate CSR, Lockers, Blockchain & Drives...");

        // 1. Create System Administrator
        User adminUser = User.builder()
                .email("admin@donateconnect.in")
                .passwordHash(passwordEncoder.encode("admin123"))
                .fullName("Aarav Sharma (System Admin)")
                .role(Role.ADMIN)
                .build();
        userRepository.save(adminUser);

        // 2. Create Indian Volunteer Logistics Coordinator
        User volunteerUser = User.builder()
                .email("dispatch@donateconnect.in")
                .passwordHash(passwordEncoder.encode("driver123"))
                .fullName("Vikram Singh (Volunteer Logistics Coordinator)")
                .role(Role.VOLUNTEER)
                .build();
        userRepository.save(volunteerUser);

        // 3. Create Indian Corporate CSR Account
        User corporateUser = User.builder()
                .email("csr@tata.com")
                .passwordHash(passwordEncoder.encode("corporate123"))
                .fullName("Tata Consultancy Services (TCS CSR Wing)")
                .role(Role.CORPORATE)
                .build();
        userRepository.save(corporateUser);

        // 4. Create Indian Sample Donor Accounts
        User donorUser = User.builder()
                .email("priya.patel@gmail.com")
                .passwordHash(passwordEncoder.encode("donor123"))
                .fullName("Priya Patel")
                .role(Role.DONOR)
                .build();
        userRepository.save(donorUser);

        User donorUser2 = User.builder()
                .email("rahul.verma@gmail.com")
                .passwordHash(passwordEncoder.encode("donor123"))
                .fullName("Rahul Verma")
                .role(Role.DONOR)
                .build();
        userRepository.save(donorUser2);

        // 5. Create Prominent Verified Indian NGO Partners
        NGOProfile goonjNgo = createNgo(
                "contact@goonj.org",
                "password123",
                "Goonj Foundation",
                "Turning urban surplus clothes, household goods, and sanitary items into a catalyst for rural development and disaster relief across 23 Indian states.",
                "J-93, Sarita Vihar, Institutional Area, New Delhi - 110076",
                "+91 11 2697 2351",
                true
        );

        NGOProfile akshayaPatraNgo = createNgo(
                "info@akshayapatra.org",
                "password123",
                "Akshaya Patra Foundation",
                "Operating the world's largest mid-day meal program, serving wholesome hot cooked meals to over 2 million school children across India every day.",
                "HK Hill, Chord Road, Rajajinagar, Bengaluru, Karnataka - 560010",
                "+91 80 3014 3400",
                true
        );

        NGOProfile prathamNgo = createNgo(
                "connect@pratham.org",
                "password123",
                "Pratham Education Foundation",
                "Innovative learning organization improving the quality of elementary education in India through community libraries and textbook drives.",
                "Y.B. Chavan Centre, Gen. J. Bhosale Marg, Nariman Point, Mumbai, Maharashtra - 400021",
                "+91 22 2281 9560",
                true
        );

        NGOProfile helpAgeNgo = createNgo(
                "hepline@helpageindia.org",
                "password123",
                "HelpAge India Relief Society",
                "Advocating for disadvantaged elderly citizens, providing mobile healthcare vans, winter clothing, and emergency shelter care.",
                "C-14, Qutab Institutional Area, New Delhi - 110016",
                "+91 11 4168 8950",
                true
        );

        NGOProfile smileNgo = createNgo(
                "contact@smilefoundation.org",
                "password123",
                "Smile Toy & Child Care Trust",
                "Empowering underprivileged children through education, pediatric nutrition, and collecting games and learning toys for shelter homes.",
                "161 B/4, 3rd Floor, Gulmohar House, Yusuf Sarai, New Delhi - 110016",
                "+91 11 4312 3700",
                true
        );

        // 6. Create Sample Indian Donations
        Donation d1 = createSampleDonation(donorUser, goonjNgo, Category.CLOTHES, "Box of 20 cotton sarees, winter shawls, and children's sweaters in pristine condition.", DonationStatus.REQUESTED, LocalDate.now().plusDays(2));
        Donation d2 = createSampleDonation(donorUser, prathamNgo, Category.BOOKS, "Complete set of NCERT Class 6-10 science textbooks, RD Sharma Mathematics, and Panchatantra story books.", DonationStatus.ACCEPTED, LocalDate.now().plusDays(1));
        Donation d3 = createSampleDonation(donorUser, akshayaPatraNgo, Category.FOOD, "100 kg Basmati rice bags, Toor dal, and refined sunflower oil tins for relief kitchen.", DonationStatus.DELIVERED, LocalDate.now().minusDays(3));

        // 7. Seed Direct Coordination Comments
        commentRepository.save(DonationComment.builder()
                .donation(d1)
                .author(donorUser)
                .message("Namaste! All clothes are washed, ironed, and packed in two sturdy cardboard boxes. Ready for pickup in Noida Sector 62.")
                .build());

        commentRepository.save(DonationComment.builder()
                .donation(d1)
                .author(goonjNgo.getUser())
                .message("Thank you Priya Ji! Our Goonj volunteer team will come by tomorrow between 11 AM and 1 PM.")
                .build());

        // 8. Seed Real Donor Ratings & Testimonials
        ratingRepository.save(NgoRating.builder()
                .ngo(goonjNgo)
                .donor(donorUser)
                .rating(5)
                .review("Outstanding transparent process! The Goonj volunteer provided a digital acknowledgement receipt immediately.")
                .build());

        ratingRepository.save(NgoRating.builder()
                .ngo(akshayaPatraNgo)
                .donor(donorUser2)
                .rating(5)
                .review("Seamless food relief delivery to the Rajajinagar kitchen. Verified and dedicated team!")
                .build());

        // 9. Seed Indian Urgent Appeal Campaigns
        urgentNeedRepository.save(NgoUrgentNeed.builder()
                .ngo(helpAgeNgo)
                .title("Urgent Appeal: 200 Woolen Blankets & Tarpaulins for Himachal Hill Shelter Drive")
                .description("Severe winter frost has affected elderly residents in Himachal shelters. We urgently need thermal blankets, shawls, and tarps.")
                .category(Category.CLOTHES)
                .active(true)
                .build());

        urgentNeedRepository.save(NgoUrgentNeed.builder()
                .ngo(akshayaPatraNgo)
                .title("Emergency Relief Drive: Basmati Rice, Wheat Flour & Lentils Needed for Wayanad Relief Camps")
                .description("Our community kitchens are preparing 5,000 daily hot meals for flood displaced families. Contributions of staple grains requested urgently.")
                .category(Category.FOOD)
                .active(true)
                .build());

        // 10. Seed Indian Smart Lockers
        smartLockerRepository.save(SmartLocker.builder()
                .name("Delhi Metro Rajiv Chowk Hub Locker Station #01")
                .address("Connaught Place Outer Circle, Gate No. 3, New Delhi - 110001")
                .totalLockers(30)
                .availableLockers(22)
                .pinCode("110001")
                .build());

        smartLockerRepository.save(SmartLocker.builder()
                .name("Namma Metro Majestic Inter-Change Locker Hub #04")
                .address("Kempegowda Bus Station Concourse, Bengaluru, Karnataka - 560009")
                .totalLockers(24)
                .availableLockers(16)
                .pinCode("560009")
                .build());

        smartLockerRepository.save(SmartLocker.builder()
                .name("Mumbai Central Local Railway Locker Station #02")
                .address("Dadar Station Platform 1 Concourse, Mumbai, Maharashtra - 400014")
                .totalLockers(20)
                .availableLockers(14)
                .pinCode("400014")
                .build());

        // 11. Seed Blockchain Audit Blocks
        blockchainBlockRepository.save(BlockchainBlock.builder()
                .blockIndex(0)
                .previousHash("0000000000000000000000000000000000000000000000000000000000000000")
                .hash("a8f3b21c4e9d6f0b8a7c5e3d2f1a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a")
                .donationId(d1.getId())
                .action("GENESIS_BLOCK_DONATION_SUBMITTED")
                .timestamp(LocalDateTime.now().minusDays(2))
                .build());

        blockchainBlockRepository.save(BlockchainBlock.builder()
                .blockIndex(1)
                .previousHash("a8f3b21c4e9d6f0b8a7c5e3d2f1a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a")
                .hash("7c9b2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c")
                .donationId(d3.getId())
                .action("AKSHAYA_PATRA_RECEIPT_CONFIRMED_DELIVERED")
                .timestamp(LocalDateTime.now().minusDays(1))
                .build());

        // 12. Seed Inter-NGO Surplus Trade
        ngoResourceTradeRepository.save(NgoResourceTrade.builder()
                .offeringNgo(akshayaPatraNgo)
                .offeredCategory(Category.FOOD)
                .offeredQuantity(50)
                .requestedCategory(Category.CLOTHES)
                .requestedQuantity(25)
                .active(true)
                .build());

        // 13. Seed Corporate CSR Drive
        corporateDriveRepository.save(CorporateDrive.builder()
                .corporateUser(corporateUser)
                .companyName("Tata Consultancy Services (TCS)")
                .campaignTitle("Pan-India Employee Zero-Waste & Shiksha Donation Drive 2026")
                .description("Nationwide TCS employee initiative collecting 1,000+ school kits, laptops, and woolen clothes for rural schools in Maharashtra and Karnataka.")
                .targetItemCount(1000)
                .collectedItemCount(680)
                .startDate(LocalDate.now().minusDays(15))
                .endDate(LocalDate.now().plusDays(15))
                .build());

        log.info("Successfully seeded Indian NGOs, Admin, Driver, Corporate CSR, Donors, Lockers, Blockchain, Trades & Drives!");
    }

    private NGOProfile createNgo(String email, String password, String ngoName, String description, String address, String phone, boolean verified) {
        User ngoUser = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .fullName(ngoName + " Manager")
                .role(Role.NGO)
                .build();
        User savedUser = userRepository.save(ngoUser);

        NGOProfile profile = NGOProfile.builder()
                .user(savedUser)
                .name(ngoName)
                .description(description)
                .address(address)
                .phone(phone)
                .verified(verified)
                .build();

        return ngoProfileRepository.save(profile);
    }

    private Donation createSampleDonation(User donor, NGOProfile ngo, Category category, String description, DonationStatus status, LocalDate pickupDate) {
        Donation donation = Donation.builder()
                .donor(donor)
                .ngo(ngo)
                .category(category)
                .description(description)
                .photoUrls(List.of())
                .status(status)
                .pickupDate(pickupDate)
                .build();

        Donation saved = donationRepository.save(donation);

        StatusHistory history = StatusHistory.builder()
                .donation(saved)
                .status(status)
                .build();
        statusHistoryRepository.save(history);
        return saved;
    }
}
