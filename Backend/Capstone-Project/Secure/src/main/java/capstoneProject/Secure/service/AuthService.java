package capstoneProject.Secure.service;

import capstoneProject.Secure.Exception.UserExistException;
import capstoneProject.Secure.model.Person;
import capstoneProject.Secure.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public Person saveUser(Person user){
        user.setPassword((passwordEncoder.encode(user.getPassword())));
        try {
            return userRepository.save(user);
        }
        catch (Exception e){
            throw new UserExistException("User already");
        }
    }
    public String generateToken(String username)
    {
        return jwtService.generateToken(username);
    }

    public void validateToken(String token) {
        jwtService.validateToken(token);
    }
    public boolean isUserRegistered(String username) {
        // Check if a user with the given username already exists in the database
        return userRepository.existsByUsername(username);
    }
}