package com.samedesk.backend.realtime;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ExecutorChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;

@Configuration
@EnableWebSocketMessageBroker
class StompConfig implements WebSocketMessageBrokerConfigurer {

    private final StompRoomAccess access;
    private final String[] allowedOrigins;
    private final TaskScheduler heartbeatScheduler;
    private final long heartbeatMs;

    StompConfig(StompRoomAccess access, @Value("${app.cors.allowed-origins}") String[] allowedOrigins,
                @Lazy @Qualifier("messageBrokerTaskScheduler") TaskScheduler heartbeatScheduler,
                @Value("${app.websocket.heartbeat-ms:10000}") long heartbeatMs) {
        this.access = access;
        this.heartbeatScheduler = heartbeatScheduler;
        if (heartbeatMs < 100) {
            throw new IllegalArgumentException("WebSocket heartbeat interval must be at least 100 ms");
        }
        this.heartbeatMs = heartbeatMs;
        this.allowedOrigins = Arrays.stream(allowedOrigins).map(String::trim).toArray(String[]::new);
        if (Arrays.asList(this.allowedOrigins).contains("*")) {
            throw new IllegalArgumentException("WebSocket origins must be explicit");
        }
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins(allowedOrigins);
        registry.setErrorHandler(new StompSubProtocolErrorHandler() {
            @Override
            public Message<byte[]> handleClientMessageProcessingError(Message<byte[]> frame, Throwable error) {
                Throwable cause = NestedExceptionUtils.getMostSpecificCause(error);
                String code = switch (cause) {
                    case BadCredentialsException ignored -> "UNAUTHENTICATED";
                    case AccessDeniedException ignored -> "FORBIDDEN";
                    default -> "INVALID_FRAME";
                };
                StompHeaderAccessor headers = StompHeaderAccessor.create(StompCommand.ERROR);
                headers.setMessage(code);
                headers.setLeaveMutable(true);
                return MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
            }
        });
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(heartbeatScheduler)
                .setHeartbeatValue(new long[] {heartbeatMs, heartbeatMs});
        registry.setUserDestinationPrefix("/user");
        registry.setPreservePublishOrder(true);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setTimeToFirstMessage(10_000);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(access);
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ExecutorChannelInterceptor() {
            @Override
            public Message<?> beforeHandle(Message<?> message, MessageChannel channel, MessageHandler handler) {
                return access.authorizeDelivery(message);
            }
        });
    }
}
