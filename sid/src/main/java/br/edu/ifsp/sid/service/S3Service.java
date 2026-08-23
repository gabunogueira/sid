package br.edu.ifsp.sid.service;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import br.edu.ifsp.sid.dto.ImageResponse;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class S3Service {
    
    private final S3Client s3Client;
    
    @Value("${cloud.aws.s3.bucket-name}")
    private String bucketName;

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public List<String> listBuckets () {
        var response = s3Client.listBuckets();
        var buckets = response.buckets();

        var bucketsName = buckets.stream().map((b) -> b.name()).toList();
        return bucketsName;        
    }


    public String uploadImage(MultipartFile image) throws IOException {
        var imageKey = UUID.randomUUID().toString();
        
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
        .bucket(bucketName)
        .key(imageKey)
        .contentType(image.getContentType())
        .build();

        s3Client.putObject(putObjectRequest, 
            RequestBody.fromInputStream(image.getInputStream(), image.getSize())
        );

        return s3Client.utilities().getUrl(b -> b.bucket(bucketName).key(imageKey)).toExternalForm();

    }

    public List<ImageResponse> listAllImages() {
    ListObjectsV2Request request = ListObjectsV2Request.builder()
            .bucket(bucketName)
            .build();

    ListObjectsV2Response response = s3Client.listObjectsV2(request);

    return response.contents().stream()
            .map(s3Object -> {
                String key = s3Object.key();
                // Generate the S3 URL for each object
                String url = s3Client.utilities()
                        .getUrl(b -> b.bucket(bucketName).key(key))
                        .toExternalForm();
                return new ImageResponse(key, url);
            })
            .toList();
    }


}
