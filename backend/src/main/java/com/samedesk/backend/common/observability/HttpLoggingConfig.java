package com.samedesk.backend.common.observability;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class HttpLoggingConfig {

    @Bean
    FilterRegistrationBean<HttpRequestLogFilter> httpRequestLogFilter() {
        var registration = new FilterRegistrationBean<>(new HttpRequestLogFilter());
        registration.addUrlPatterns("/api/*");
        // Before Spring Security, so rejected requests also get an identifier and a completion log.
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        return registration;
    }
}
