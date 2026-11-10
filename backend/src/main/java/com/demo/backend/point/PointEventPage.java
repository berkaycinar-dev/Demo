package com.demo.backend.point;

import java.util.List;
import org.springframework.data.domain.Page;

/** One page of the points history, newest first. */
public record PointEventPage(
        List<PointEventResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages) {

    static PointEventPage of(Page<PointEvent> page) {
        return new PointEventPage(page.getContent().stream().map(PointEventResponse::of).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
