-- This is an empty migration.
CREATE UNIQUE INDEX videos_video_url_unique
ON videos(video_url)
WHERE deleted_at IS NULL;