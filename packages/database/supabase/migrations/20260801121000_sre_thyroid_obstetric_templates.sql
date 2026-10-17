-- SRE Phase 1: seed thyroid TI-RADS + obstetric biometry templates (stable UUIDs).

insert into public.report_templates (
  id,
  slug,
  domain,
  version,
  locales,
  schema_json,
  engine_id,
  title_key,
  description_key,
  is_active
)
values
(
  '00000000-0000-4000-8000-000000000002',
  'thyroid-tirads-v1',
  'thyroid',
  '1.0.0',
  '{ru,en}',
  '{
    "fields": [
      {"id": "composition", "type": "enum", "labelKey": "field.composition", "required": false, "group": "morphology"},
      {"id": "echogenicity", "type": "enum", "labelKey": "field.echogenicity", "required": false, "group": "morphology"},
      {"id": "shape", "type": "enum", "labelKey": "field.shape", "required": false, "group": "morphology"},
      {"id": "margin", "type": "enum", "labelKey": "field.margin", "required": false, "group": "morphology"},
      {"id": "echogenicFoci", "type": "enum", "labelKey": "field.echogenic_foci", "required": false, "group": "morphology"},
      {"id": "noduleMaxDiameterMm", "type": "measurement_mm", "labelKey": "field.nodule_mm", "required": false, "group": "measurements"},
      {"id": "thyroidVolumeMl", "type": "number", "labelKey": "field.thyroid_volume_ml", "required": false, "group": "measurements"},
      {"id": "freeTextFindings", "type": "text", "labelKey": "field.free_text", "required": false, "group": "free_text"}
    ]
  }'::jsonb,
  'sre-thyroid-v1',
  'template.thyroid_tirads_v1.title',
  'template.thyroid_tirads_v1.description',
  true
),
(
  '00000000-0000-4000-8000-000000000003',
  'obstetric-biometry-v1',
  'obstetric',
  '1.0.0',
  '{ru,en}',
  '{
    "fields": [
      {"id": "gestationalAgeWeeks", "type": "number", "labelKey": "field.ga_weeks", "required": false, "group": "context"},
      {"id": "gestationalAgeDays", "type": "number", "labelKey": "field.ga_days", "required": false, "group": "context"},
      {"id": "crlMm", "type": "measurement_mm", "labelKey": "field.crl_mm", "required": false, "group": "measurements"},
      {"id": "bpdMm", "type": "measurement_mm", "labelKey": "field.bpd_mm", "required": false, "group": "measurements"},
      {"id": "hcMm", "type": "measurement_mm", "labelKey": "field.hc_mm", "required": false, "group": "measurements"},
      {"id": "acMm", "type": "measurement_mm", "labelKey": "field.ac_mm", "required": false, "group": "measurements"},
      {"id": "flMm", "type": "measurement_mm", "labelKey": "field.fl_mm", "required": false, "group": "measurements"},
      {"id": "efwGrams", "type": "number", "labelKey": "field.efw_g", "required": false, "group": "measurements"},
      {"id": "freeTextFindings", "type": "text", "labelKey": "field.free_text", "required": false, "group": "free_text"}
    ]
  }'::jsonb,
  'sre-obstetric-v1',
  'template.obstetric_biometry_v1.title',
  'template.obstetric_biometry_v1.description',
  true
)
on conflict (slug) do update set
  domain = excluded.domain,
  version = excluded.version,
  locales = excluded.locales,
  schema_json = excluded.schema_json,
  engine_id = excluded.engine_id,
  title_key = excluded.title_key,
  description_key = excluded.description_key,
  is_active = excluded.is_active,
  updated_at = now();
