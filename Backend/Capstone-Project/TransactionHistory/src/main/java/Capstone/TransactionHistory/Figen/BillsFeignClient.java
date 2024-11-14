package Capstone.TransactionHistory.Figen;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "bills-service", url = "http://localhost:9007/bills")
public interface BillsFeignClient {
    @GetMapping("/fixed-expenses/{accountId}")
    Long getTotalFixedExpenses(@PathVariable Long accountId);
} 