package br.edu.ifsp.sid.service;

import java.util.List;

import org.springframework.stereotype.Service;

import software.amazon.awssdk.services.s3.S3Client;

@Service
public class S3Service {
    
    private final S3Client s3Client;

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public List<String> listBuckets () {
        var response = s3Client.listBuckets();
        var buckets = response.buckets();

        var bucketsName = buckets.stream().map((b) -> b.name()).toList();
        return bucketsName;        
    }

}
