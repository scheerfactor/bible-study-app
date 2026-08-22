drop policy if exists "Anyone can create beta feedback" on public.beta_feedback;

create policy "Anyone can create beta feedback"
  on public.beta_feedback for insert
  to anon, authenticated
  with check (
    length(trim(message)) > 0
    and length(message) <= 5000
    and (passage_or_resource is null or length(passage_or_resource) <= 500)
    and (optional_email is null or length(optional_email) <= 320)
    and category in (
      'Bug report',
      'Suggestion',
      'Resource issue',
      'Commentary issue',
      'Audio issue',
      'Study workflow issue',
      'Bible Reader',
      'Study Drawer',
      'Passage Guide',
      'Library',
      'Search',
      'Mobile Layout',
      'Sermons / Presentations',
      'Author / publisher partnership',
      'Publisher product feedback',
      'Other'
    )
  );
