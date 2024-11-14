package Capstone.TransactionHistory.service;

import Capstone.TransactionHistory.Figen.AccountsFeignClient;
import Capstone.TransactionHistory.Figen.BillsFeignClient;
import Capstone.TransactionHistory.Figen.CategoryFeignClient;
import Capstone.TransactionHistory.Repository.repo;
import Capstone.TransactionHistory.DTO.AccountDTO;
import Capstone.TransactionHistory.DTO.CategoryDTO;
import Capstone.TransactionHistory.model.Transactions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;

import java.util.*;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;

@Service
public class Serve {

    private final String SECRET_KEY = "your-secret-key-must-be-at-least-256-bits-long";

    @Autowired
    private repo transactionRepo;

    @Autowired
    private AccountsFeignClient accountsFeignClient;

    @Autowired
    private CategoryFeignClient categoryFeignClient;

    @Autowired
    private BillsFeignClient billsFeignClient;

    public List<Transactions> validate(String token) {
        try {
            String jwtToken = token.replace("Bearer ", "");
            SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
            
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(jwtToken)
                    .getBody();
            
            Long personId = Long.parseLong(claims.get("personId").toString());
            return transactionRepo.findByPersonId(personId);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

//    public ResponseEntity<?> processSalaryTransaction(Transactions transaction, String option) {
//        try {
//            // Validate the transaction is a salary credit
//            if (!"CREDIT".equals(transaction.getTransactionType())) {
//                return ResponseEntity.badRequest().body("Not a credit transaction");
//            }
//
//            // Process based on option
//            switch (option) {
//                case "CARRY_FORWARD":
//                    // Simply save the transaction
//                    transaction = transactionRepo.save(transaction);
//                    break;
//
//                case "SAVE_TO_SAVINGS":
//                    // Transfer to savings account
//                    ResponseEntity<?> transferResponse = accountsFeignClient.updateBalance(
//                        transaction.getAccountId(),
//                        transaction.getAmount()
//                    );
//                    if (transferResponse.getStatusCode().is2xxSuccessful()) {
//                        transaction = transactionRepo.save(transaction);
//                    } else {
//                        return ResponseEntity.badRequest().body("Failed to transfer to savings");
//                    }
//                    break;
//
//                case "REPAY_LOAN":
//                    // Handle loan repayment logic
//                    // You might want to add a LoanFeignClient for this
//                    transaction = transactionRepo.save(transaction);
//                    break;
//
//                default:
//                    return ResponseEntity.badRequest().body("Invalid option");
//            }
//
//            return ResponseEntity.ok(transaction);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body("Error processing salary: " + e.getMessage());
//        }
//    }

    public ResponseEntity<?> getDashboardInfo(Long personId) {
        try {
            Map<String, Object> dashboardInfo = new HashMap<>();
            
            // Get account details
            ResponseEntity<AccountDTO> accountResponse = accountsFeignClient.getAccountById(personId);
            dashboardInfo.put("account", accountResponse.getBody());
            
            // Get recent transactions
            List<Transactions> recentTransactions = transactionRepo.findByAccountId(personId);
            dashboardInfo.put("recentTransactions", recentTransactions);
            
            // Get total expenses
            Long totalExpenses = recentTransactions.stream()
                .filter(t -> "DEBIT".equals(t.getTransactionType()))
                .mapToLong(Transactions::getAmount)
                .sum();
            dashboardInfo.put("totalExpenses", totalExpenses);
            
            return ResponseEntity.ok(dashboardInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching dashboard info: " + e.getMessage());
        }
    }
    public ResponseEntity<?> getAllTransactions(Long personId) {
        try {
            List<Transactions> transactions = transactionRepo.findByPersonId(personId);
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching transactions: " + e.getMessage());
        }
    }

    public ResponseEntity<?> getDashboardData(Long accountId) {
        try {
            Map<String, Object> dashboard = new HashMap<>();
            
            ResponseEntity<AccountDTO> accountResponse = accountsFeignClient.getAccountById(accountId);
            AccountDTO account = accountResponse.getBody();
            
            Long fixedExpenses = billsFeignClient.getTotalFixedExpenses(accountId);
            
            List<Transactions> transactions = transactionRepo.findByAccountId(accountId);
            
            dashboard.put("account", account);
            dashboard.put("fixedExpenses", fixedExpenses);
            dashboard.put("transactions", transactions);
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching dashboard data: " + e.getMessage());
        }
    }

    public ResponseEntity<?> processTransactionWithCategory(Transactions transaction, Long categoryId) {
        try {
            ResponseEntity<CategoryDTO> categoryResponse = categoryFeignClient.getCategoryById(categoryId);
            CategoryDTO category = categoryResponse.getBody();
            
            if (category != null) {
                transaction.setCategoryId(categoryId);
                transaction = transactionRepo.save(transaction);
                return ResponseEntity.ok(transaction);
            } else {
                return ResponseEntity.badRequest().body("Category not found");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing transaction: " + e.getMessage());
        }
    }

    public ResponseEntity<?> getSpendingAnalytics(Long personId) {
        try {
            // Get categories for person
            ResponseEntity<List<CategoryDTO>> categoriesResponse = 
                categoryFeignClient.getCategoriesByPerson(personId);
            
            // Get transactions grouped by category
            List<Transactions> transactions = transactionRepo.findByPersonId(personId);
            
            Map<String, Double> categorySpending = new HashMap<>();
            // Process and calculate spending by category
            
            return ResponseEntity.ok(categorySpending);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error generating analytics: " + e.getMessage());
        }
    }

    public ResponseEntity<?> getRecentTransactions(Long personId) {
        try {
            List<Transactions> recentTransactions = transactionRepo.findByPersonIdOrderByDateDesc(personId);
            
            if (recentTransactions.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            
            List<Transactions> limitedTransactions = recentTransactions.stream()
                    .limit(5)
                    .collect(Collectors.toList());
                    
            return ResponseEntity.ok(limitedTransactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching recent transactions: " + e.getMessage());
        }
    }
    public ResponseEntity<?> deleteTransaction(Long transactionId) {
        try {
            Optional<Transactions> transaction = transactionRepo.findById(transactionId);
            
            if (!transaction.isPresent()) {
                return ResponseEntity.ok("No transaction found with ID: " + transactionId);
            }

            transactionRepo.deleteById(transactionId);
            return ResponseEntity.ok("Successfully deleted transaction with ID: " + transactionId);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting transaction: " + e.getMessage());
        }
    }
    public Transactions save(Transactions transaction) {
        try {
            // Basic validation
            if (transaction.getAccountId() == null || 
                transaction.getAmount() == null || 
                transaction.getTransactionType() == null) {
                throw new IllegalArgumentException("Missing required transaction details");
            }
            
            // Update account balance before saving transaction
            ResponseEntity<?> updateResponse = updateBalance(transaction);
            if (!updateResponse.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Failed to update account balance");
            }
            
            // Save and return the transaction
            return transactionRepo.save(transaction);
            
        } catch (Exception e) {
            throw new RuntimeException("Error saving transaction: " + e.getMessage());
        }
    }
    private ResponseEntity<?> updateBalance(Transactions transaction) {
        // Check if it's a credit or debit transaction
        if ("CREDIT".equals(transaction.getTransactionType())) {
            return accountsFeignClient.updateBalance(transaction.getAccountId(), transaction.getAmount(), "ADD");
        } else if ("DEBIT".equals(transaction.getTransactionType())) {
            return accountsFeignClient.updateBalance(transaction.getAccountId(), transaction.getAmount(), "SUBTRACT");
        } else {
            return ResponseEntity.badRequest().body("Invalid transaction type");
        }
    }

}