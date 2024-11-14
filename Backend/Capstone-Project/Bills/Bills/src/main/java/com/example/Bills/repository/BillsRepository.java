package com.example.Bills.repository;

import com.example.Bills.model.Bills;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillsRepository extends JpaRepository<Bills, Long> {
    List<Bills> findByAccountIdAndIsFixedExpenseTrue(Long accountId);
    List<Bills> findByAccountId(Long accountId);
}
