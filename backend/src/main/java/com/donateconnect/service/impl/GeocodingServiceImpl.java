package com.donateconnect.service.impl;

import com.donateconnect.entity.NGOProfile;
import com.donateconnect.repository.NGOProfileRepository;
import com.donateconnect.service.GeocodingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeocodingServiceImpl implements GeocodingService {

    private final NGOProfileRepository ngoProfileRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Transactional
    public NGOProfile geocodeAndCacheNgoAddress(NGOProfile ngo) {
        if (ngo == null) return null;

        // If coordinates are already cached on entity, return directly without re-geocoding
        if (ngo.getLatitude() != null && ngo.getLongitude() != null) {
            return ngo;
        }

        if (ngo.getAddress() == null || ngo.getAddress().trim().isEmpty()) {
            // Default fallback coordinates if address empty
            ngo.setLatitude(28.6139);
            ngo.setLongitude(77.2090);
            return ngoProfileRepository.save(ngo);
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl("https://nominatim.openstreetmap.org/search")
                    .queryParam("format", "json")
                    .queryParam("q", ngo.getAddress())
                    .queryParam("limit", "1")
                    .build()
                    .toUriString();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "DonateConnectApp/1.0 (contact@donateconnect.org)");
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<List> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    requestEntity,
                    List.class
            );

            if (response.getBody() != null && !response.getBody().isEmpty()) {
                Map<?, ?> first = (Map<?, ?>) response.getBody().get(0);
                if (first.containsKey("lat") && first.containsKey("lon")) {
                    double lat = Double.parseDouble(first.get("lat").toString());
                    double lon = Double.parseDouble(first.get("lon").toString());
                    ngo.setLatitude(lat);
                    ngo.setLongitude(lon);
                    log.info("Successfully geocoded NGO '{}' address '{}' to [{}, {}]", ngo.getName(), ngo.getAddress(), lat, lon);
                    return ngoProfileRepository.save(ngo);
                }
            }
        } catch (Exception e) {
            log.warn("Nominatim geocoding failed for NGO '{}' address '{}': {}", ngo.getName(), ngo.getAddress(), e.getMessage());
        }

        // Fallback for test / non-geocodable addresses so entity gets cached and doesn't re-geocode endlessly
        ngo.setLatitude(28.6139 + (Math.abs(ngo.getId().hashCode() % 100) * 0.005));
        ngo.setLongitude(77.2090 + (Math.abs(ngo.getId().hashCode() % 100) * 0.005));
        log.info("Applied default fallback geocode to NGO '{}': [{}, {}]", ngo.getName(), ngo.getLatitude(), ngo.getLongitude());
        return ngoProfileRepository.save(ngo);
    }
}
