package br.edu.ifsp.sid.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.edu.ifsp.sid.service.S3Service;

@RestController
@RequestMapping("/bucket")
public class S3Controller {
    
    private final S3Service s3Service;

    public S3Controller(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @GetMapping
    public ResponseEntity<List<String>> listBuckets(){
        var names = s3Service.listBuckets();
        return ResponseEntity.status(HttpStatus.OK).body(names);
    }


}
