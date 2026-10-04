package com.donateconnect.service;

import com.donateconnect.entity.NGOProfile;

public interface GeocodingService {
    NGOProfile geocodeAndCacheNgoAddress(NGOProfile ngo);
}
