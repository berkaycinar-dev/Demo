package com.demo.backend.point;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** One reason a user earned points. Maps the {@code point_events} table (V7). Rows are never changed. */
@Entity
@Table(name = "point_events")
public class PointEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "kind", nullable = false, updatable = false, length = 20)
    private PointKind kind;

    @Column(name = "source_key", nullable = false, updatable = false, length = 64)
    private String sourceKey;

    @Column(name = "points", nullable = false, updatable = false)
    private int points;

    @Column(name = "base_points", nullable = false, updatable = false)
    private int basePoints;

    @Column(name = "bonus_points", nullable = false, updatable = false)
    private int bonusPoints;

    @Column(name = "focus_seconds", nullable = false, updatable = false)
    private int focusSeconds;

    @Column(name = "preset", nullable = false, updatable = false, length = 10)
    private String preset;

    @Column(name = "earned_at", nullable = false, updatable = false)
    private Instant earnedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected PointEvent() {
        // for JPA
    }

    public PointEvent(UUID userId, PointKind kind, String sourceKey, PointRules.Award award,
                      int focusSeconds, String preset, Instant earnedAt, Instant createdAt) {
        this.userId = userId;
        this.kind = kind;
        this.sourceKey = sourceKey;
        this.points = award.total();
        this.basePoints = award.basePoints();
        this.bonusPoints = award.bonusPoints();
        this.focusSeconds = focusSeconds;
        this.preset = preset;
        this.earnedAt = earnedAt;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public PointKind getKind() {
        return kind;
    }

    public String getSourceKey() {
        return sourceKey;
    }

    public int getPoints() {
        return points;
    }

    public int getBasePoints() {
        return basePoints;
    }

    public int getBonusPoints() {
        return bonusPoints;
    }

    public int getFocusSeconds() {
        return focusSeconds;
    }

    public String getPreset() {
        return preset;
    }

    public Instant getEarnedAt() {
        return earnedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
