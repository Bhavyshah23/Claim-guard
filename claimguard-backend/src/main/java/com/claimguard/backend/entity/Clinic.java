package com.claimguard.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clinic")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Clinic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String address;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // One clinic has many users - mappedBy points to the "clinic" field in User.java
    // @ToString.Exclude and @EqualsAndHashCode.Exclude prevent infinite recursion,
    // since User also references back to Clinic (bidirectional relationship)
    @OneToMany(mappedBy = "clinic", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @lombok.ToString.Exclude
    @lombok.EqualsAndHashCode.Exclude
    private List<User> users = new ArrayList<>();
}