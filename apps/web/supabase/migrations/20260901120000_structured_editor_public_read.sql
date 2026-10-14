-- Allow read-only access to structured case documents for published public teaching cases.

drop policy if exists case_structured_documents_public_read on public.case_structured_documents;
create policy case_structured_documents_public_read on public.case_structured_documents
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.cases c
      where c.id = case_structured_documents.case_id
        and c.status = 'published'
        and c.is_public = true
    )
  );
