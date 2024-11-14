package Capstone.TransactionHistory.Control;

import Capstone.TransactionHistory.Figen.AccountsFeignClient;
import Capstone.TransactionHistory.model.Transactions;
import Capstone.TransactionHistory.service.Serve;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/TransactionHistory")
@CrossOrigin(origins = "*")
public class controller {

    @Autowired
    private Serve serve;

    @Autowired
    private AccountsFeignClient accountsFeignClient;

    @GetMapping
    public List<Transactions> validate(@RequestHeader("Authorization") String token) {
        return serve.validate(token);
    }
    @PostMapping("/transaction")
    public ResponseEntity<?> addTransaction(@RequestBody Transactions transaction) {
        try {
            // Validate transaction data
            if (transaction.getAccountId() == null || 
                transaction.getAmount() == null || 
                transaction.getTransactionType() == null) {
                return ResponseEntity.badRequest().body("Missing required transaction details");
            }
            
            // Save the transaction
            Transactions savedTransaction = serve.save(transaction);
            return ResponseEntity.ok(savedTransaction);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing transaction: " + e.getMessage());
        }
    }

//    @PostMapping("/salary")
//    public ResponseEntity<?> processSalaryTransaction(@RequestBody Transactions transaction,
//                                                    @RequestParam String option) {
//        return serve.processSalaryTransaction(transaction, option);
//    }

    @GetMapping("/dashboard/{personId}")
    public ResponseEntity<?> getDashboardInfo(@PathVariable Long personId) {

        return serve.getDashboardInfo(personId);
    }

    @GetMapping("/person/{personId}/recent")
    public ResponseEntity<?> getRecentTransactions(@PathVariable Long personId) {
        return serve.getRecentTransactions(personId);
    }
    @GetMapping("/person/{personId}")
    public ResponseEntity<?> getAllTransactions(@PathVariable Long personId) {
        return serve.getAllTransactions(personId);
    }
    @DeleteMapping("/transaction/{transactionId}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long transactionId) {
        return serve.deleteTransaction(transactionId);
    }
    // ... other endpoints ...
}