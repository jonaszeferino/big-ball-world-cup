-- Frase de status no perfil (navbar), editável pelo próprio utilizador.

alter table public.profiles add column if not exists status_message text;

comment on column public.profiles.status_message is 'Frase curta exibida na navbar (estilo status).';
