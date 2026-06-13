package com.somap.backend;

import com.somap.backend.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class SomapBackendApplicationTests {

	@Autowired
	private EmailService emailService;

	@Test
	void contextLoads() {
	}

	@Test
	void testSendEmail() {
		try {
			System.out.println("=== TESTING EMAIL SENDING ===");
			emailService.sendResetCode("somapservice11@gmail.com", "1234");
			System.out.println("=== EMAIL SENT SUCCESSFULLY ===");
		} catch (Exception e) {
			System.err.println("=== EMAIL SENDING FAILED ===");
			e.printStackTrace();
			throw e;
		}
	}

}
