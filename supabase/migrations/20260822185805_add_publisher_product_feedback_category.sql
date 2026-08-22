alter table public.beta_feedback
  drop constraint if exists beta_feedback_category_check;

alter table public.beta_feedback
  add constraint beta_feedback_category_check
  check (
    category in (
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
