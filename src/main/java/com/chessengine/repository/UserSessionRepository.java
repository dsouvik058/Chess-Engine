package com.chessengine.repository;

import com.chessengine.model.UserSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSessionEntity, String> {

    Optional<UserSessionEntity> findByToken(String token);

    void deleteByToken(String token);
}
