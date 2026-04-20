-- Create herb_images table for storing Cloudinary URLs per herb
CREATE TABLE IF NOT EXISTS herb_images (
    id SERIAL PRIMARY KEY,
    herb_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_herb_images_herb_id ON herb_images(herb_id);
