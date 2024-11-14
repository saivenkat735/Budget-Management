package com.Capstone.Category.service;

import com.Capstone.Category.model.Category;
import com.Capstone.Category.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {
    @Autowired
    private CategoryRepository categoryRepository;



    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category category) {
        Category existingCategory = categoryRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        
        existingCategory.setCategoryName(category.getCategoryName());
        existingCategory.setType(category.getType());
        existingCategory.setPersonId(category.getPersonId());
        existingCategory.setIsFloatingExpense(category.getIsFloatingExpense());
        existingCategory.setAmountSpent(category.getAmountSpent());
        
        return categoryRepository.save(existingCategory);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }

    public List<Category> getCategoriesByPersonId(Long personId) {
        return categoryRepository.findByPersonId(personId);
    }

    public List<Category> getFloatingExpenseCategories() {
        return categoryRepository.findByIsFloatingExpenseTrue();
    }


}
