package com.demo.backend.point;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

/** Pure arithmetic: no Spring, no database, no mocks. */
class PointRulesTest {

    private static PointRules rules(int perMinute, Map<String, Integer> bonus) {
        return new PointRules(new PointProperties(perMinute, bonus, "UTC"));
    }

    private final PointRules defaults = rules(1, Map.of("25-5", 0, "50-10", 10, "90-15", 25));

    @Test
    void shortBlockEarnsOnePointPerMinuteAndNoBonus() {
        PointRules.Award award = defaults.forFocusBlock("25-5", 25 * 60);

        assertThat(award.basePoints()).isEqualTo(25);
        assertThat(award.bonusPoints()).isZero();
        assertThat(award.total()).isEqualTo(25);
    }

    @Test
    void mediumBlockGetsTheBonus() {
        PointRules.Award award = defaults.forFocusBlock("50-10", 50 * 60);

        assertThat(award.basePoints()).isEqualTo(50);
        assertThat(award.bonusPoints()).isEqualTo(10);
        assertThat(award.total()).isEqualTo(60);
    }

    @Test
    void longBlockGetsTheBiggestBonus() {
        assertThat(defaults.forFocusBlock("90-15", 90 * 60).total()).isEqualTo(115);
    }

    @Test
    void presetWithoutABonusEntryGetsNone() {
        PointRules.Award award = rules(1, Map.of()).forFocusBlock("50-10", 50 * 60);

        assertThat(award.bonusPoints()).isZero();
        assertThat(award.total()).isEqualTo(50);
    }

    @Test
    void missingBonusMapIsTreatedAsEmpty() {
        assertThat(rules(1, null).forFocusBlock("90-15", 90 * 60).total()).isEqualTo(90);
    }

    @Test
    void perMinuteValueScalesTheBase() {
        assertThat(rules(2, Map.of()).forFocusBlock("25-5", 25 * 60).basePoints()).isEqualTo(50);
    }

    @Test
    void onlyWholeMinutesCount() {
        assertThat(rules(1, Map.of()).forFocusBlock("25-5", 25 * 60 + 59).basePoints()).isEqualTo(25);
    }

    @Test
    void negativeSettingsNeverTakePointsAway() {
        PointRules.Award award = rules(-3, Map.of("25-5", -10)).forFocusBlock("25-5", 25 * 60);

        assertThat(award.total()).isZero();
    }
}
