package com.somap.backend.dto;

import lombok.Data;

@Data
public class VerifyCodeDTO {
     
    private String email;
    private String code;
}
