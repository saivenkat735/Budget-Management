//package Capstone.TransactionHistory.dto;
//
//import jakarta.validation.constraints.Min;
//import jakarta.validation.constraints.NotBlank;
//import jakarta.validation.constraints.NotNull;
//import jakarta.validation.constraints.PastOrPresent;
//import lombok.AllArgsConstructor;
//import lombok.Data;
//import lombok.NoArgsConstructor;
//
//import java.time.LocalDate;
//
//@AllArgsConstructor
//@NoArgsConstructor
//@Data
//
//public class TransactionsDTO {
//    @NotBlank(message = "Account name is required")
//    private String accountName;
//
//    @NotNull(message = "Item ID is required")
//    @Min(value = 1, message = "Item ID must be a positive number")
//    private Long itemId;
//
//    @NotBlank(message = "Goal is required")
//    private String goal;
//
//    @NotNull(message = "this should not be null")
//    private String userName;
//
//    @NotBlank(message = "Transaction type is required")
//    private String transactionType;
//
//    @NotNull(message = "Date is required")
//    @PastOrPresent(message = "Date cannot be in the future")
//    private LocalDate date;
//
//    @NotNull(message = "Amount is required")
//    @Min(value = 0, message = "Amount must be a positive number")
//    private Long amount;
//
//    // Getters and Setters
//}
