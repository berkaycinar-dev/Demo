package com.demo.backend.room;

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

/** Maps the {@code rooms} table (V4 migration). Never returned from the API; use RoomResponse. */
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(length = 200)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RoomVisibility visibility;

    @Column(name = "invite_code", length = 16)
    private String inviteCode;

    @Column(name = "max_members", nullable = false)
    private int maxMembers;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Set by the database trigger; the app never writes it.
    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;

    protected Room() {
        // for JPA
    }

    public Room(String name, String description, RoomVisibility visibility, String inviteCode,
                int maxMembers, UUID ownerId, Instant createdAt) {
        this.name = name;
        this.description = description;
        this.visibility = visibility;
        this.inviteCode = inviteCode;
        this.maxMembers = maxMembers;
        this.ownerId = ownerId;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public RoomVisibility getVisibility() {
        return visibility;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public int getMaxMembers() {
        return maxMembers;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
