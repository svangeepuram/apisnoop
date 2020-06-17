CREATE UNLOGGED TABLE audit_event (
  release text,
  release_date text,
  audit_id text NOT NULL,
  endpoint text,
  useragent text,
  test text,
  test_hit boolean,
  conf_test_hit boolean,
  data jsonb NOT NULL,
  id int GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  ingested_at timestamp DEFAULT CURRENT_TIMESTAMP
);