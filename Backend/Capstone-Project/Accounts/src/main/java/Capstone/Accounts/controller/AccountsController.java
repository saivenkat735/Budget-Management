package Capstone.Accounts.controller;

import Capstone.Accounts.dto.AccountsDTO;
import Capstone.Accounts.model.Accounts;
import Capstone.Accounts.repo.Repository;
import Capstone.Accounts.service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/accounts")
@Validated
public class AccountsController {
    @Autowired
    private Repository repo;

    @Autowired
    private service serve;

    @PostMapping
    public ResponseEntity<?> createAccount( @RequestBody AccountsDTO accountDTO) {
        try {
            Accounts account = new Accounts();
            account.setAccountName(accountDTO.getAccountName());
            account.setUserName(accountDTO.getUserName());
            account.setPersonId(accountDTO.getId());
            account.setCardType(accountDTO.getCardType());
            account.setBalance(accountDTO.getBalance());
            
            Accounts savedAccount = repo.save(account);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedAccount);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating account: " + e.getMessage());
        }
    }

    @GetMapping("/{accountId}")
    public ResponseEntity<?> getAccountById(@PathVariable Long accountId) {
        return repo.findById(accountId)
                .map(account -> ResponseEntity.ok().body(account))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{accountId}/balance")
    public ResponseEntity<?> updateBalance(
            @PathVariable Long accountId,
            @RequestParam Long amount,
            @RequestParam String operation) {
        
        try {
            return repo.findById(accountId)
                    .map(account -> {
                        if ("ADD".equals(operation)) {
                            account.setBalance(account.getBalance() + amount);
                        } else if ("SUBTRACT".equals(operation)) {
                            if (account.getBalance() >= amount) {
                                account.setBalance(account.getBalance() - amount);
                            } else {
                                return ResponseEntity.badRequest()
                                    .body("Insufficient balance");
                            }
                        }else{
                            account.setBalance(amount);
                        }
                        Accounts updatedAccount = repo.save(account);
                        return ResponseEntity.ok().body(updatedAccount);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating balance: " + e.getMessage());
        }
    }

    @GetMapping("/person/{personId}")
    public ResponseEntity<?> getAccountsByPerson(@PathVariable Long personId) {
        try {
            List<Accounts> accounts = repo.findByPersonId(personId);
            return ResponseEntity.ok().body(accounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching accounts: " + e.getMessage());
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestHeader("Authorization") String token) {
        try {
            List<Accounts> accounts = serve.validate(token);
            return ResponseEntity.ok().body(accounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid token: " + e.getMessage());
        }
    }
    @DeleteMapping("/{accountId}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long accountId) {
        try {
            return repo.findById(accountId)
                    .map(account -> {
                        account.setActive(false); // Soft delete by marking as inactive
                        Accounts updatedAccount = repo.save(account);
                        return ResponseEntity.ok().body("Account deactivated successfully");
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deactivating account: " + e.getMessage());
        }
    }
    @PutMapping("/{accountId}/reactivate")
    public ResponseEntity<?> reactivateAccount(@PathVariable Long accountId) {
        try {
            return repo.findById(accountId)
                    .map(account -> {
                        account.setActive(true); // Reactivate account by setting active to true
                        Accounts updatedAccount = repo.save(account);
                        return ResponseEntity.ok().body("Account reactivated successfully");
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error reactivating account: " + e.getMessage());
        }
    }
}
