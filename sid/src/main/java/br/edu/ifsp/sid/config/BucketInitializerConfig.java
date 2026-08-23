package br.edu.ifsp.sid.config;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.BucketAlreadyExistsException;
import software.amazon.awssdk.services.s3.model.BucketAlreadyOwnedByYouException;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BucketInitializerConfig {

    private static final Logger log = LoggerFactory.getLogger(BucketInitializerConfig.class);

    @Value("${cloud.aws.s3.bucket-name}")
    private String bucketName;

    @Bean
    public ApplicationRunner verifyBucketExists(S3Client s3Client) {
        return (ApplicationArguments args) -> {
            log.info("Checking if S3 bucket '{}' exists...", bucketName);
            
            try {
                // Optional: Automatically create the bucket if missing
                s3Client.createBucket(CreateBucketRequest.builder()
                        .bucket(bucketName)
                        .build());

                log.info("Bucket '{}' created successfully. ", bucketName);  
            } 
            catch (BucketAlreadyExistsException e){
                log.info("Bucket '{}' already exist. ", bucketName);
                throw new IllegalStateException("Critical dependency missing: Bucket unavailable", e);
            }
            catch (BucketAlreadyOwnedByYouException e) {
                log.info("Bucket already owned by you " + bucketName);
            }

        };
    }
}