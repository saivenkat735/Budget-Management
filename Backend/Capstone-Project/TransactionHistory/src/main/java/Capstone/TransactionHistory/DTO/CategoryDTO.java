package Capstone.TransactionHistory.DTO;

import lombok.Data;

@Data
public class CategoryDTO {
    private Long categoryId;
    private String categoryName;
    private String type;
    private Long personId;
    private Boolean isFloatingExpense;
} 