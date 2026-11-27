package com.samedesk.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.samedesk.backend.common.error.BusinessRuleException;
import com.samedesk.backend.common.error.UnauthorizedException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class UserServiceTest {

    private static final UUID ME = UUID.randomUUID();

    private final UserRepository users = mock(UserRepository.class);
    private final UserService service = new UserService(users);

    @Test
    void storesTheAvatarAndReturnsIt() {
        User user = new User("ada@example.com", "ada_l", "hash", Instant.parse("2026-11-07T10:00:00Z"));
        when(users.findById(ME)).thenReturn(Optional.of(user));

        UserResponse res = service.changeAvatar(ME, Map.of("body", "female"));

        assertThat(user.getAvatar()).isEqualTo("{\"body\":\"female\"}");
        assertThat(res.avatar()).isEqualTo("{\"body\":\"female\"}");
    }

    @Test
    void invalidAvatarIsRefusedBeforeLoadingTheUser() {
        assertThatThrownBy(() -> service.changeAvatar(ME, Map.of("size", 3)))
                .isInstanceOf(BusinessRuleException.class);
        verify(users, never()).findById(any());
    }

    @Test
    void deletedAccountIsUnauthenticated() {
        when(users.findById(ME)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changeAvatar(ME, Map.of("body", "male")))
                .isInstanceOf(UnauthorizedException.class);
    }
}
