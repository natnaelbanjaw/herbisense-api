-- Local full bootstrap migration.
-- Purpose: create/patch all database objects required by the current API in one file.
-- Safe to run multiple times.

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- CONDITIONS
CREATE TABLE IF NOT EXISTS conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    herb_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conditions_name ON conditions(name);

-- HERBS
CREATE TABLE IF NOT EXISTS herbs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    description TEXT,
    preparation TEXT,
    safety_warning TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_by INTEGER,
    condition_id INTEGER,
    average_rating NUMERIC(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE herbs ADD COLUMN IF NOT EXISTS condition_id INTEGER;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_herbs_name ON herbs(name);
CREATE INDEX IF NOT EXISTS idx_herbs_status ON herbs(status);
CREATE INDEX IF NOT EXISTS idx_herbs_created_by ON herbs(created_by);
CREATE INDEX IF NOT EXISTS idx_herbs_condition_id ON herbs(condition_id);

-- DIRECT LINKS BETWEEN HERBS AND CONDITIONS
ALTER TABLE conditions ADD COLUMN IF NOT EXISTS herb_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_herbs_created_by'
  ) THEN
    ALTER TABLE herbs
    ADD CONSTRAINT fk_herbs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_herbs_condition_id'
  ) THEN
    ALTER TABLE herbs
    ADD CONSTRAINT fk_herbs_condition_id
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_conditions_herb_id'
  ) THEN
    ALTER TABLE conditions
    ADD CONSTRAINT fk_conditions_herb_id
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conditions_herb_id ON conditions(herb_id);

-- LEGACY MANY-TO-MANY COMPAT TABLE (some legacy queries still reference it)
CREATE TABLE IF NOT EXISTS herb_conditions (
    herb_id INTEGER NOT NULL,
    condition_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (herb_id, condition_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_herb_conditions_herb_id'
  ) THEN
    ALTER TABLE herb_conditions
    ADD CONSTRAINT fk_herb_conditions_herb_id
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_herb_conditions_condition_id'
  ) THEN
    ALTER TABLE herb_conditions
    ADD CONSTRAINT fk_herb_conditions_condition_id
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_herb_conditions_condition_id ON herb_conditions(condition_id);

-- RECOMMENDATION RULES
CREATE TABLE IF NOT EXISTS recommendation_rules (
    id SERIAL PRIMARY KEY,
    herb_id INTEGER NOT NULL,
    condition_id INTEGER NOT NULL,
    priority INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(herb_id, condition_id)
);

ALTER TABLE recommendation_rules ADD COLUMN IF NOT EXISTS priority INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_recommendation_rules_herb_id'
  ) THEN
    ALTER TABLE recommendation_rules
    ADD CONSTRAINT fk_recommendation_rules_herb_id
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_recommendation_rules_condition_id'
  ) THEN
    ALTER TABLE recommendation_rules
    ADD CONSTRAINT fk_recommendation_rules_condition_id
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recommendation_rules_herb_id ON recommendation_rules(herb_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_rules_condition_id ON recommendation_rules(condition_id);

-- FAVORITES
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    herb_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, herb_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_favorites_user_id'
  ) THEN
    ALTER TABLE favorites
    ADD CONSTRAINT fk_favorites_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_favorites_herb_id'
  ) THEN
    ALTER TABLE favorites
    ADD CONSTRAINT fk_favorites_herb_id
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_herb_id ON favorites(herb_id);

-- RATINGS
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    herb_id INTEGER,
    rule_id INTEGER,
    rating INTEGER,
    rating_value NUMERIC(2,1),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_ratings_user_id'
  ) THEN
    ALTER TABLE ratings
    ADD CONSTRAINT fk_ratings_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_ratings_herb_id'
  ) THEN
    ALTER TABLE ratings
    ADD CONSTRAINT fk_ratings_herb_id
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_ratings_rule_id'
  ) THEN
    ALTER TABLE ratings
    ADD CONSTRAINT fk_ratings_rule_id
    FOREIGN KEY (rule_id) REFERENCES recommendation_rules(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ratings_user_herb
ON ratings(user_id, herb_id)
WHERE herb_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ratings_user_herb_full
ON ratings(user_id, herb_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ratings_user_rule
ON ratings(user_id, rule_id)
WHERE rule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ratings_rule_id ON ratings(rule_id);
CREATE INDEX IF NOT EXISTS idx_ratings_herb_id ON ratings(herb_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);

-- TRANSLATIONS
CREATE TABLE IF NOT EXISTS language_translations (
    id SERIAL PRIMARY KEY,
    herb_id INTEGER NOT NULL,
    language VARCHAR(2) NOT NULL,
    translated_name VARCHAR(255) NOT NULL,
    translated_uses TEXT NOT NULL,
    translated_preparation TEXT NOT NULL,
    translated_safety TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_translation UNIQUE (herb_id, language)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_language_translations_herb_id'
  ) THEN
    ALTER TABLE language_translations
    ADD CONSTRAINT fk_language_translations_herb_id
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_language_translations_language'
  ) THEN
    ALTER TABLE language_translations
    ADD CONSTRAINT chk_language_translations_language
    CHECK (language IN ('EN', 'AM', 'OM'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_language_translations_herb_id
ON language_translations(herb_id);
CREATE INDEX IF NOT EXISTS idx_language_translations_language
ON language_translations(language);

-- HERB IMAGES
CREATE TABLE IF NOT EXISTS herb_images (
    id SERIAL PRIMARY KEY,
    herb_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_herb_images_herb_id'
  ) THEN
    ALTER TABLE herb_images
    ADD CONSTRAINT fk_herb_images_herb_id
    FOREIGN KEY (herb_id) REFERENCES herbs(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_herb_images_herb_id ON herb_images(herb_id);
