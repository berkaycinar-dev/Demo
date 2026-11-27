package com.samedesk.backend.user;

import com.samedesk.backend.common.error.UnauthorizedException;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Profile changes of the signed-in user. */
@Service
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    /** Replaces the user's avatar. Room members see it on their next presence refresh. */
    @Transactional
    public UserResponse changeAvatar(UUID userId, Map<String, Object> avatar) {
        String json = AvatarRules.toJson(avatar);
        User user = users.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("UNAUTHENTICATED", "Account no longer exists."));
        user.changeAvatar(json);
        return UserResponse.from(user);
    }
}
