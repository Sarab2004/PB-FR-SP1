-- یک درخواست کالا نمونه
insert into public.warehouse_requests (requester_id, title, description, item_code, specs, usage_location, priority, items, required_date)
select
  (select id from public.users where email='requester1@test.com'),
  'A4 Paper Supply', 'Monthly usage', 'A4-80G', '80gsm, 500 sheets', 'HQ Office', 'HIGH',
  '[{"sku":"A4-80G","name":"A4 Paper","qty":10,"unit":"pack"}]'::jsonb,
  current_date + 7;
