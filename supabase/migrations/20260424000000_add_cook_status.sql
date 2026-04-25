-- Allow 'cook' status in restaurants table
ALTER TABLE restaurants DROP CONSTRAINT IF EXISTS restaurants_status_check;
ALTER TABLE restaurants ADD CONSTRAINT restaurants_status_check CHECK (status IN ('been', 'want', 'cook'));
