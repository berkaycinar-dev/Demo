package com.demo.backend.point;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PointProperties.class)
public class PointConfig {
}
