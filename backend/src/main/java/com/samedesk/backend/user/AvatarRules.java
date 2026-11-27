package com.samedesk.backend.user;

import com.samedesk.backend.common.error.BusinessRuleException;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Pattern;
import tools.jackson.databind.json.JsonMapper;

/**
 * Checks an avatar before it is stored. An avatar is a flat object of option ids (strings) and
 * on/off switches (booleans). Which ids exist is the frontend's business, so they are not checked
 * here; this only keeps the value small and flat, so it is safe to send to everyone in a room.
 */
final class AvatarRules {

    static final String INVALID = "INVALID_AVATAR";
    static final int MAX_FIELDS = 64;
    static final int MAX_VALUE_LENGTH = 40;
    private static final Pattern KEY = Pattern.compile("[A-Za-z][A-Za-z0-9]{0,31}");
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private AvatarRules() {
    }

    /** Returns the avatar as compact JSON (keys sorted), or throws INVALID_AVATAR. */
    static String toJson(Map<String, Object> avatar) {
        if (avatar == null || avatar.isEmpty() || avatar.size() > MAX_FIELDS) {
            throw invalid("Avatar must have 1 to " + MAX_FIELDS + " fields.");
        }
        Map<String, Object> clean = new TreeMap<>();
        for (Map.Entry<String, Object> e : avatar.entrySet()) {
            if (!KEY.matcher(e.getKey()).matches()) {
                throw invalid("Avatar field names are letters and digits, at most 32 characters.");
            }
            Object value = e.getValue();
            boolean ok = value instanceof Boolean
                    || (value instanceof String s && s.length() <= MAX_VALUE_LENGTH);
            if (!ok) {
                throw invalid("Avatar values are text (at most " + MAX_VALUE_LENGTH + " characters) or true/false.");
            }
            clean.put(e.getKey(), value);
        }
        return JSON.writeValueAsString(clean);
    }

    private static BusinessRuleException invalid(String message) {
        return new BusinessRuleException(INVALID, message);
    }
}
