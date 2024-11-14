package Capstone.TransactionHistory.Figen;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "Accounts", url = "http://localhost:2001/api")
public interface Figen {

    @PutMapping("/accounts/updateBalance")
     void updateBalance(@RequestParam("accountName") String accountName, @RequestParam("newBalance") Long newBalance);

    @GetMapping("/accounts/getBalance")
    Long getBalance(@RequestParam("accountName") String accountName);

}