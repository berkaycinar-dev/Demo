package com.demo.backend.ping;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Web slice test: starts only the MVC layer (this controller + JSON), no database.
 * The service is mocked, so this checks only the HTTP contract:
 * path, status code and JSON field names from contracts/openapi.yaml.
 */
@WebMvcTest(PingController.class)
class PingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PingService pingService;

    @Test
    void pingReturnsContractShape() throws Exception {
        when(pingService.ping())
                .thenReturn(new PingResponse("pong", Instant.parse("2026-10-29T20:00:00Z")));

        mockMvc.perform(get("/api/v1/ping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("pong"))
                .andExpect(jsonPath("$.serverTime").value("2026-10-29T20:00:00Z"));
    }
}
