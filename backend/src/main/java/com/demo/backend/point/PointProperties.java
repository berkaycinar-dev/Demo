package com.demo.backend.point;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Settings under {@code app.points} in application.yml.
 *
 * @param perFocusMinute points for every minute of a finished focus block
 * @param blockBonus     extra points for a finished block, by preset id ("25-5" -> 0, "50-10" -> 10 ...)
 * @param dayZone        time zone that decides where "today" starts (IANA id)
 */
@ConfigurationProperties(prefix = "app.points")
public record PointProperties(
        @DefaultValue("1") int perFocusMinute,
        @DefaultValue Map<String, Integer> blockBonus,
        @DefaultValue("Europe/Istanbul") String dayZone) {
}
