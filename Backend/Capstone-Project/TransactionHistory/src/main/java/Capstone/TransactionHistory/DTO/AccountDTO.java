package Capstone.TransactionHistory.DTO;

import lombok.Data;

@Data
public class AccountDTO {
    private Long accountId;
    private String accountName;
    private Long personId;
    private String cardType;
    private Long balance;
} 