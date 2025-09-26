create or replace function public.approve_request(p_wr_id uuid, p_manager_id uuid)
returns void
language plpgsql
as $$
begin
  update public.warehouse_requests
  set status = 'APPROVED'
  where id = p_wr_id;

  insert into public.audit_log(actor_id, entity, entity_id, action)
  values (p_manager_id, 'WarehouseRequest', p_wr_id, 'APPROVE');
end
$$;