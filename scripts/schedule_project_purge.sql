select cron.schedule(
    'purge-expired-projects',
    '15 2 * * *',
    'select public.purge_expired_projects();'
);
