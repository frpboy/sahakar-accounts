-- Add Google Drive folder URL to outlets
ALTER TABLE public.outlets
ADD COLUMN IF NOT EXISTS drive_folder_url text;

-- Optional index for lookups (by code and by drive_folder_url)
CREATE INDEX IF NOT EXISTS outlets_code_idx ON public.outlets (code);
CREATE INDEX IF NOT EXISTS outlets_drive_folder_url_idx ON public.outlets (drive_folder_url);
