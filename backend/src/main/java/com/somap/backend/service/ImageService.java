package com.somap.backend.service;

import com.somap.backend.dto.ImageDTO;

import java.util.List;

public interface ImageService {

    ImageDTO uploadImage(ImageDTO imageDTO);

    List<ImageDTO> getAllImages();

    ImageDTO getImageById(Long id);

    void deleteImage(Long id);
}