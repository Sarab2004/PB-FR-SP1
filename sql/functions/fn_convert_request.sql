create or replace function public.convert_request(
  p_wr_id uuid,
  p_manager_id uuid
) returns uuid
language plpgsql
as $$
declare
  v_existing_pr uuid;
  v_new_pr uuid;
begin
  -- اگر قبلاً PR ساخته شده، همان را برگردان
  select id into v_existing_pr
  from public.purchase_requests
  where source_wrequest_id = p_wr_id;

  if v_existing_pr is not null then
    return v_existing_pr;
  end if;

  -- ایجاد PR جدید از روی WR (فیلدهای قابل‌انتقال)
  insert into public.purchase_requests (
    source_wrequest_id, manager_id, items, usage_location, priority, status
  )
  select
    wr.id, p_manager_id, wr.items, wr.usage_location, wr.priority, 'DRAFT'
  from public.warehouse_requests wr
  where wr.id = p_wr_id
  returning id into v_new_pr;

  -- وضعیت WR را به CONVERTED تغییر بده (اختیاری اما مفید)
  update public.warehouse_requests
  set status = 'CONVERTED'
  where id = p_wr_id;

  -- لاگ عملیات
  insert into public.audit_log(actor_id, entity, entity_id, action, payload)
  values (p_manager_id, 'WarehouseRequest', p_wr_id, 'CONVERT', jsonb_build_object('purchase_request_id', v_new_pr));

  return v_new_pr;
end
$$;
