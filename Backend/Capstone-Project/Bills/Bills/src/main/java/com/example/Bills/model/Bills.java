package com.example.Bills.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bills {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long billId;

    private Long accountId;
    private String billName;
    private String itemDesc;
    private double amount;
    private LocalDate dueDate;
    private boolean isFixedExpense = true;
    private boolean isPaid;

}
