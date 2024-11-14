package com.example.Bills.controller;

import com.example.Bills.model.Bills;
import com.example.Bills.repository.BillsRepository;
import com.example.Bills.service.BillsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

//@CrossOrigin("*")
@RestController
@RequestMapping("/bills")
@CrossOrigin("*")
// replace with your frontend URL
public class BillsController {
    @Autowired
    private BillsService service;
    @PostMapping("/addbills")
    private Bills addBills(@RequestBody Bills bill){
        return service.addBills(bill);
    }
    @GetMapping("/getbills")
    private List<Bills> getAllBills(){
        return service.getAllBills();
    }
    @PutMapping("/update/{billId}")
    public Bills updateBillById(@PathVariable Long billId, @RequestBody Bills updatedBill) {
        return service.updateBillById(billId, updatedBill);
    }
    @DeleteMapping("/delete/{billId}")
    private void deleteBillById(@PathVariable Long billId){
        service.deleteBillById(billId);
    }

    @GetMapping("/fixed-expenses/{accountId}")
    Long getTotalFixedExpenses(@PathVariable Long accountId){
        return service.getTotalFixedExpenses(accountId);
    }


    @GetMapping("/person/{personId}")
    public ResponseEntity<?> getBillsByPerson(@PathVariable Long personId) {
        try {
            List<Bills> bills = service.getBillsByPersonId(personId);
            return ResponseEntity.ok(bills);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching bills: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/paid")
    public ResponseEntity<?> payBillById(@PathVariable long id){
        return new ResponseEntity<>(service.payBill(id),HttpStatus.OK);
    }
}
