package com.office.brewdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BrewdeskApplication {

	public static void main(String[] args) {
		SpringApplication.run(BrewdeskApplication.class, args);
	}

}
