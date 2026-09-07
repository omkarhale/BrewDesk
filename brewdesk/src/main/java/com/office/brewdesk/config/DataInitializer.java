package com.office.brewdesk.config;

import com.office.brewdesk.entity.Beverage;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.enums.Role;
import com.office.brewdesk.repository.BeverageRepository;
import com.office.brewdesk.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BeverageRepository beverageRepository;

    @Override
    public void run(String... args) {

        createUsers();

        createBeverages();
    }

    private void createUsers() {

        if (userRepository.findByEmail("superadmin@brewdesk.com").isEmpty()) {

            User admin = User.builder()
                    .name("Super Admin")
                    .email("superadmin@brewdesk.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.SUPER_ADMIN)
                    .active(true)
                    .build();

            userRepository.save(admin);
        }
    }

    private void createBeverages() {

        if (beverageRepository.findByName("Chai").isEmpty()) {

            Beverage chai = Beverage.builder()
                    .name("Chai")
                    .icon("🍵")
                    .active(true)
                    .build();

            beverageRepository.save(chai);
        }

        if (beverageRepository.findByName("Coffee").isEmpty()) {

            Beverage coffee = Beverage.builder()
                    .name("Coffee")
                    .icon("☕")
                    .active(true)
                    .build();

            beverageRepository.save(coffee);
        }

        if (beverageRepository.findByName("Black Tea").isEmpty()) {

            Beverage blackTea = Beverage.builder()
                    .name("Black Tea")
                    .icon("🫖")
                    .active(true)
                    .build();

            beverageRepository.save(blackTea);
        }
    }
}