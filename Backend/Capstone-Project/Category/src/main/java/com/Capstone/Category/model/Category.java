package com.Capstone.Category.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long categoryId;
    
    private String categoryName;
    private String type; // CREDIT, DEBIT
    private Long personId;
    private Boolean isFloatingExpense;

    private Double amountSpent = 0.0; // Default to 0.0 if no transactions have occurred
}
