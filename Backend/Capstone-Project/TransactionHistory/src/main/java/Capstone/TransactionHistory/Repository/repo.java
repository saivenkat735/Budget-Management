package Capstone.TransactionHistory.Repository;

import Capstone.TransactionHistory.model.Transactions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface repo extends JpaRepository<Transactions, Long> {
    List<Transactions> findByPersonId(Long personId);
    List<Transactions> findByPersonIdOrderByDateDesc(Long personId);
    List<Transactions> findByAccountId(Long accountId);
}
