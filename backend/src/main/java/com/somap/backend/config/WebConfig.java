package com.somap.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // For uploaded files (dynamic storage)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");

        // For static images inside resources
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");
    }
}