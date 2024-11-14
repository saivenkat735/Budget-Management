package Capstone.Accounts.repo;

import Capstone.Accounts.model.Accounts;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface Repository extends JpaRepository<Accounts, Long> {

    List<Accounts> findByUserName(String userName);

    List<Accounts> findByPersonId(Long personId);

    Accounts findByAccountName(String accountName);
}
