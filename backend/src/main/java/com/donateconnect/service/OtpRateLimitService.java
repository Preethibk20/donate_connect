package com.donateconnect.service;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;

@Service
public class OtpRateLimitService {
    // Basic in-memory rate limiting per IP
    private final ConcurrentHashMap<String, IpStats> ipLimits = new ConcurrentHashMap<>();

    private static class IpStats {
        int count;
        LocalDateTime firstResendAt;

        IpStats(int count, LocalDateTime firstResendAt) {
            this.count = count;
            this.firstResendAt = firstResendAt;
        }
    }

    public boolean isIpRateLimited(String ip) {
        if (ip == null) return false;
        
        IpStats stats = ipLimits.get(ip);
        if (stats == null) {
            ipLimits.put(ip, new IpStats(1, LocalDateTime.now()));
            return false;
        }
        
        // Reset if 1 hour has passed
        if (LocalDateTime.now().minusHours(1).isAfter(stats.firstResendAt)) {
            stats.count = 1;
            stats.firstResendAt = LocalDateTime.now();
            return false;
        }
        
        if (stats.count >= 5) {
            return true;
        }
        
        stats.count++;
        return false;
    }
}
