package br.edu.ifsp.sid.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    @PutMapping(value = "/variants/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> updateImgVariant(
        @RequestPart("image") MultipartFile image,
        @RequestParam Long id
    ){
        String imgUrl;

            try {
                imgUrl = s3Service.uploadImage(image);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.FAILED_DEPENDENCY).body(null);
            }
            return ResponseEntity.status(HttpStatus.OK).body(imgUrl); 
        
        
    }


}
