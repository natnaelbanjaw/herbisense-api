-- Add direct cross-reference columns between herbs and conditions
ALTER TABLE herbs
ADD COLUMN IF NOT EXISTS condition_id INTEGER;

ALTER TABLE conditions
ADD COLUMN IF NOT EXISTS herb_id INTEGER;

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

CREATE INDEX IF NOT EXISTS idx_herbs_condition_id ON herbs(condition_id);
CREATE INDEX IF NOT EXISTS idx_conditions_herb_id ON conditions(herb_id);
