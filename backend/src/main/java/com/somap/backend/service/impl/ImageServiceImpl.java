package com.somap.backend.service.impl;

import com.somap.backend.dto.ImageDTO;
import com.somap.backend.service.ImageService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ImageServiceImpl implements ImageService {

    @Override
    public ImageDTO uploadImage(ImageDTO imageDTO) {
        return null;
    }

    @Override
    public List<ImageDTO> getAllImages() {
        return null;
    }

    @Override
    public ImageDTO getImageById(Long id) {
        return null;
    }

    @Override
    public void deleteImage(Long id) {

    }
}