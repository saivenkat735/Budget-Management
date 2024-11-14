package com.example.Bills.service;

import com.example.Bills.exception.BillNotFoundException;
import com.example.Bills.model.Bills;
import com.example.Bills.repository.BillsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BillsService {
    @Autowired
    private BillsRepository billrepo;

    public Bills addBills(Bills bill) {
        return billrepo.save(bill);
    }

    public List<Bills> getAllBills() {
        return billrepo.findAll();
    }

    public Bills updateBillById(Long billId, Bills updatedBill) {
        Optional<Bills> existingBill = billrepo.findById(billId);

        if (existingBill.isPresent()) {
            Bills bill = existingBill.get();
            bill.setBillName(updatedBill.getBillName());
            bill.setItemDesc(updatedBill.getItemDesc());
            bill.setAmount(updatedBill.getAmount());
            bill.setDueDate(updatedBill.getDueDate());
            bill.setFixedExpense(updatedBill.isFixedExpense());
            bill.setPaid(updatedBill.isPaid());

            return billrepo.save(bill);
        } else {
            throw new BillNotFoundException("Bill with ID " + billId + " not found.");
        }
    }
    public List<Bills> getBillsByPersonId(Long personId) {
        return billrepo.findByAccountId(personId);
    }

    public void deleteBillById(Long billId) {
        if (billrepo.existsById(billId)) {
            billrepo.deleteById(billId);
        } else {
            throw new BillNotFoundException("Bill with ID " + billId + " not found.");
        }
    }

    public Long getTotalFixedExpenses(Long accountId) {
        return billrepo.findByAccountIdAndIsFixedExpenseTrue(accountId)
                .stream()
                .mapToLong(bill -> (long) bill.getAmount())
                .sum();
    }
    public Bills payBill(Long billId) {
        Optional<Bills> existingBill = billrepo.findById(billId);
        
        if (existingBill.isPresent()) {
            Bills bill = existingBill.get();
            bill.setPaid(true);
           
            return billrepo.save(bill);
        } else {
            throw new BillNotFoundException("Bill with ID " + billId + " not found.");
        }
    }

   
}
