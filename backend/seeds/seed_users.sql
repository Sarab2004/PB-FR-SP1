insert into public.users (email, role, passcode)
values
  ('manager@test.com',   'MANAGER',   '123456'),
  ('requester1@test.com','REQUESTER', '123456')
on conflict (email) do nothing;
