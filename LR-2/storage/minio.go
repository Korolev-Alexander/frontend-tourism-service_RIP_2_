package storage

type MinIOClient struct {
	endpoint string
	bucket   string
}

func NewMinIOClient() *MinIOClient {
	return &MinIOClient{
		endpoint: "localhost", // через Nginx на порту 80
		bucket:   "images",
	}
}

func (m *MinIOClient) GetImageURL(filename string) string {
	return "http://" + m.endpoint + "/" + m.bucket + "/" + filename
}
