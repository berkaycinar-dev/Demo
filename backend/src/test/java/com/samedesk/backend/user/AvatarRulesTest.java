package com.samedesk.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.samedesk.backend.common.error.BusinessRuleException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AvatarRulesTest {

    @Test
    void writesCompactJsonWithSortedKeys() {
        Map<String, Object> avatar = new HashMap<>();
        avatar.put("topColor", "teal");
        avatar.put("bangs", true);
        avatar.put("body", "female");

        assertThat(AvatarRules.toJson(avatar)).isEqualTo("{\"bangs\":true,\"body\":\"female\",\"topColor\":\"teal\"}");
    }

    @Test
    void escapesTextSoTheStoredValueStaysValidJson() {
        assertThat(AvatarRules.toJson(Map.of("name", "a\"b"))).isEqualTo("{\"name\":\"a\\\"b\"}");
    }

    @Test
    void refusesEmptyOrTooManyFields() {
        assertInvalid(Map.of());
        Map<String, Object> big = new HashMap<>();
        for (int i = 0; i <= AvatarRules.MAX_FIELDS; i++) {
            big.put("f" + i, "x");
        }
        assertInvalid(big);
    }

    @Test
    void refusesNestedNumbersNullsAndLongText() {
        assertInvalid(Map.of("hat", Map.of("id", "cap")));
        assertInvalid(Map.of("hat", List.of("cap")));
        assertInvalid(Map.of("size", 3));
        Map<String, Object> withNull = new HashMap<>();
        withNull.put("hat", null);
        assertInvalid(withNull);
        assertInvalid(Map.of("hat", "x".repeat(AvatarRules.MAX_VALUE_LENGTH + 1)));
    }

    @Test
    void refusesOddFieldNames() {
        assertInvalid(Map.of("", "x"));
        assertInvalid(Map.of("1hat", "x"));
        assertInvalid(Map.of("hat-color", "x"));
        assertInvalid(Map.of("h".repeat(33), "x"));
    }

    private static void assertInvalid(Map<String, Object> avatar) {
        assertThatThrownBy(() -> AvatarRules.toJson(avatar))
                .isInstanceOf(BusinessRuleException.class)
                .extracting("code").isEqualTo("INVALID_AVATAR");
    }
}
