package com.demo.backend.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on @Scheduled jobs (for now: closing timed-out room sessions). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
