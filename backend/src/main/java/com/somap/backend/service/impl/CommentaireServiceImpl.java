package com.somap.backend.service.impl;

import com.somap.backend.dto.CommentaireDTO;
import com.somap.backend.entity.Client;
import com.somap.backend.entity.Commentaire;
import com.somap.backend.entity.Service;
import com.somap.backend.repository.ClientRepository;
import com.somap.backend.repository.CommentaireRepository;
import com.somap.backend.repository.ServiceRepository;
import com.somap.backend.service.CommentaireService;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class CommentaireServiceImpl implements CommentaireService {

    private final CommentaireRepository commentaireRepository;
    private final ClientRepository clientRepository;
    private final ServiceRepository serviceRepository;

    @Override
    public CommentaireDTO createCommentaire(CommentaireDTO commentaireDTO) {

        Client client = clientRepository.findById(commentaireDTO.getClientId())
                .orElseThrow(() -> new RuntimeException("Client introuvable"));

        Service service = serviceRepository.findById(commentaireDTO.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service introuvable"));

        Commentaire commentaire = new Commentaire();

        commentaire.setContenu(commentaireDTO.getContenu());
        commentaire.setDateCommentaire(commentaireDTO.getDateCommentaire());
        commentaire.setClient(client);
        commentaire.setService(service);

        Commentaire savedCommentaire = commentaireRepository.save(commentaire);

        return mapToDTO(savedCommentaire);
    }

    @Override
    public List<CommentaireDTO> getAllCommentaires() {

        return commentaireRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public CommentaireDTO getCommentaireById(Long id) {

        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire introuvable"));

        return mapToDTO(commentaire);
    }

    @Override
    public void deleteCommentaire(Long id) {

        Commentaire commentaire = commentaireRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Commentaire introuvable"));

        commentaireRepository.delete(commentaire);
    }

    // =========================
    // MAPPING
    // =========================

    private CommentaireDTO mapToDTO(Commentaire commentaire) {

        CommentaireDTO dto = new CommentaireDTO();

        dto.setId(commentaire.getId());
        dto.setContenu(commentaire.getContenu());
        dto.setDateCommentaire(commentaire.getDateCommentaire());

        if (commentaire.getClient() != null) {
            dto.setClientId(commentaire.getClient().getId());
        }

        if (commentaire.getService() != null) {
            dto.setServiceId(commentaire.getService().getId());
        }

        return dto;
    }
}