package Capstone.TransactionHistory.Figen;

import Capstone.TransactionHistory.DTO.CategoryDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@FeignClient(name = "CATEGORY-SERVICE", url = "http://localhost:2004/category")
public interface CategoryFeignClient {
    @GetMapping("/{categoryId}")
    ResponseEntity<CategoryDTO> getCategoryById(@PathVariable Long categoryId);
    
    @GetMapping("/person/{personId}")
    ResponseEntity<List<CategoryDTO>> getCategoriesByPerson(@PathVariable Long personId);
} 