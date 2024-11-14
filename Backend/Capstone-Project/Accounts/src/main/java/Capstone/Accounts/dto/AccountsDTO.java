package Capstone.Accounts.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class AccountsDTO {

    @NotNull(message = "ID cannot be null")
    private Long id;

    @NotEmpty(message = "Account name is required")
    private String accountName;

    @NotEmpty(message = "Username is required")
    private String userName;

    @NotEmpty(message = "Card type is required")
    private String cardType;

    @NotNull(message = "Balance cannot be null")
    @Min(value = 0, message = "Balance must be a positive number")
    private Long balance;

}
