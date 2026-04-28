alter table public.ideas
  drop constraint if exists ideas_text_length_check;

alter table public.ideas
  add constraint ideas_text_length_check check (char_length(trim(idea_text)) between 50 and 1000);
