-- Align preset admin and builder labels with app UI names (AD, YanLeCunn, Tim, Texas, Miami).

update public.admin_users
set display_name = 'AD', normalized_name = 'ad'
where email = 'ardadinc04@gmail.com';

update public.admin_users
set display_name = 'YanLeCunn', normalized_name = 'yanlecunn'
where email = 'luanthony523@gmail.com';

update public.admin_users
set display_name = 'Tim', normalized_name = 'tim'
where email = 'yanzewu88@gmail.com';

update public.builders
set display_name = 'AD', normalized_name = 'ad'
where normalized_name = 'arda' or display_name = 'Arda';

update public.builders
set display_name = 'YanLeCunn', normalized_name = 'yanlecunn'
where normalized_name = 'david' or display_name = 'David';

update public.builders
set display_name = 'Tim', normalized_name = 'tim'
where normalized_name = 'timur' or display_name = 'Timur';

insert into public.builders (display_name, normalized_name)
values ('Miami', 'miami')
on conflict (normalized_name) do nothing;
