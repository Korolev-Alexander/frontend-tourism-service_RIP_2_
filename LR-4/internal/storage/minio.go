package storage

import (
	"bytes"
	"context"
	"fmt"
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinIOClient struct {
	client *minio.Client
	bucket string
}

func NewMinIOClient() *MinIOClient {
	// Создаем клиент MinIO
	minioClient, err := minio.New("minio:9000", &minio.Options{
		Creds:  credentials.NewStaticV4("myaccesskey123", "mysecretkey123456", ""),
		Secure: false,
	})
	if err != nil {
		log.Printf("⚠️ Failed to create MinIO client: %v", err)
		return &MinIOClient{}
	}

	// Проверяем подключение и существование bucket
	exists, err := minioClient.BucketExists(context.Background(), "image")
	if err != nil {
		log.Printf("⚠️ MinIO connection failed: %v", err)
	} else if exists {
		log.Printf("✅ MinIO client initialized - bucket 'image' exists")
	} else {
		log.Printf("❌ MinIO bucket 'image' not found - please create manually")
	}

	return &MinIOClient{
		client: minioClient,
		bucket: "image",
	}
}

func (m *MinIOClient) UploadFile(filename string, fileData []byte) error {
	if m.client == nil {
		return fmt.Errorf("MinIO client not initialized")
	}

	// Просто загружаем файл (bucket должен быть создан заранее)
	_, err := m.client.PutObject(context.Background(), m.bucket, filename,
		bytes.NewReader(fileData), int64(len(fileData)),
		minio.PutObjectOptions{
			ContentType: "image/png",
		})

	if err != nil {
		return fmt.Errorf("failed to upload file: %v", err)
	}

	log.Printf("✅ File uploaded to MinIO: %s (%d bytes)", filename, len(fileData))
	return nil
}

func (m *MinIOClient) DeleteFile(filename string) error {
	if m.client == nil {
		return fmt.Errorf("MinIO client not initialized")
	}

	err := m.client.RemoveObject(context.Background(), m.bucket, filename,
		minio.RemoveObjectOptions{})

	if err != nil {
		return fmt.Errorf("failed to delete file: %v", err)
	}

	log.Printf("✅ File deleted from MinIO: %s", filename)
	return nil
}

func (m *MinIOClient) GetImageURL(filename string) string {
	return fmt.Sprintf("http://192.168.1.12:9000/%s/%s", m.bucket, filename)
}
