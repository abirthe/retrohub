create or replace function append_session_message(
  p_chat_id bigint,
  p_message jsonb,
  p_max_messages int default 8
) returns void
language plpgsql
set search_path = ''
as $$
declare
  v_combined jsonb;
  v_len int;
begin
  select coalesce(recent_messages, '[]'::jsonb) || jsonb_build_array(p_message)
    into v_combined
    from public.customer_support_sessions
    where chat_id = p_chat_id
    for update;

  v_len := jsonb_array_length(v_combined);

  update public.customer_support_sessions
  set recent_messages = (
        select jsonb_agg(value order by ord)
        from jsonb_array_elements(v_combined) with ordinality as t(value, ord)
        where ord > greatest(v_len - p_max_messages, 0)
      ),
      updated_at = now()
  where chat_id = p_chat_id;
end;
$$;
