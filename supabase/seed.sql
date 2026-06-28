-- Development seed data for Soochika PBMS.
-- Test password for all seeded users: Password@123

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@panchayat.gov.in', crypt('Password@123', gen_salt('bf')), now(), '{"full_name":"Panchayat Admin","role":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ward_member@panchayat.gov.in', crypt('Password@123', gen_salt('bf')), now(), '{"full_name":"Demo Ward Member","role":"ward_member","ward_number":1}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'asha1@soochika.local', crypt('Password@123', gen_salt('bf')), now(), '{"full_name":"ASHA Worker One","role":"asha_worker","ward_number":1}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ward2@soochika.local', crypt('Password@123', gen_salt('bf')), now(), '{"full_name":"Ward Member Two","role":"ward_member","ward_number":2}', now(), now()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anganwadi2@soochika.local', crypt('Password@123', gen_salt('bf')), now(), '{"full_name":"Anganwadi Worker Two","role":"anganwadi_worker","ward_number":2}', now(), now())
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

insert into public.users (id, full_name, role, ward_number, phone, is_active) values
  ('00000000-0000-0000-0000-000000000001', 'Panchayat Admin', 'admin', null, '9876500001', true),
  ('00000000-0000-0000-0000-000000000002', 'Demo Ward Member', 'ward_member', 1, '9876500002', true),
  ('00000000-0000-0000-0000-000000000003', 'ASHA Worker One', 'asha_worker', 1, '9876500003', true),
  ('00000000-0000-0000-0000-000000000004', 'Ward Member Two', 'ward_member', 2, '9876500004', true),
  ('00000000-0000-0000-0000-000000000005', 'Anganwadi Worker Two', 'anganwadi_worker', 2, '9876500005', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  ward_number = excluded.ward_number,
  phone = excluded.phone,
  is_active = excluded.is_active;

insert into public.beneficiaries (id, type, full_name, date_of_birth, gender, address, ward_number, phone, emergency_contact, is_verified, data_collected_at, registered_by) values
  ('10000000-0000-0000-0000-000000000001', 'both', 'Lakshmi Amma', '1944-02-10', 'female', 'Thanal House, Ward 1', 1, '9876543210', 'Ravi Kumar - 9876543201', true, '2026-06-01', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000002', 'elderly', 'Madhavan Nair', '1950-05-15', 'male', 'Puthenpurackal, Ward 1', 1, '9876543211', 'Mini M - 9876543202', true, '2026-06-03', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000003', 'pwd', 'Afsal Rahman', '1992-01-20', 'male', 'Rahmath Manzil, Ward 2', 2, '9876543212', 'Naseema - 9876543203', false, '2026-06-08', '00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000004', 'elderly', 'Marykutty Joseph', '1958-09-01', 'female', 'St. Mary Villa, Ward 2', 2, '9876543213', 'Joseph P - 9876543204', true, '2026-06-11', '00000000-0000-0000-0000-000000000004'),
  ('10000000-0000-0000-0000-000000000005', 'both', 'Saraswathi K', '1947-11-22', 'female', 'Kizhakkedath, Ward 1', 1, '9876543214', 'Suma K - 9876543205', false, '2026-06-14', '00000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000006', 'pwd', 'Biju Varghese', '1982-03-17', 'male', 'Grace Cottage, Ward 2', 2, '9876543215', 'Ancy B - 9876543206', true, '2026-06-16', '00000000-0000-0000-0000-000000000004')
on conflict (id) do nothing;

insert into public.health_details (beneficiary_id, lives_alone, is_bedridden, chronic_diseases, pension_status, last_health_check) values
  ('10000000-0000-0000-0000-000000000001', true, false, array['Diabetes','Hypertension'], 'receiving', '2026-06-12'),
  ('10000000-0000-0000-0000-000000000002', false, true, array['Cardiac'], 'applied', '2026-06-18'),
  ('10000000-0000-0000-0000-000000000004', false, false, array['Arthritis'], 'receiving', '2026-05-28'),
  ('10000000-0000-0000-0000-000000000005', true, false, array['COPD'], 'not_applied', '2026-06-04')
on conflict (beneficiary_id) do nothing;

insert into public.disability_details (beneficiary_id, disability_type, disability_percentage, certificate_number, assistive_devices, has_caregiver, caregiver_name, caregiver_phone) values
  ('10000000-0000-0000-0000-000000000001', 'locomotor', 75, 'PWD-W1-001', array['Walking stick'], false, null, null),
  ('10000000-0000-0000-0000-000000000003', 'hearing', 55, 'PWD-W2-002', array['Hearing aid'], true, 'Naseema', '9876543203'),
  ('10000000-0000-0000-0000-000000000005', 'visual', 45, 'PWD-W1-003', array['Spectacles'], true, 'Suma K', '9876543205'),
  ('10000000-0000-0000-0000-000000000006', 'multiple', 82, 'PWD-W2-004', array['Wheelchair'], true, 'Ancy B', '9876543206')
on conflict (beneficiary_id) do nothing;

insert into public.requests (id, beneficiary_id, request_type, other_details, status, notes, raised_by, assigned_to, created_at) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'wheelchair', null, 'pending', 'Needs wheelchair before next hospital visit.', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '2026-06-22'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'home_visit', null, 'in_progress', 'ASHA visit scheduled for vitals and medication review.', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '2026-06-20'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'pension_support', null, 'pending', 'Certificate verification pending.', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', '2026-06-19'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', 'ramp', null, 'completed', 'Ramp installation completed and verified.', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '2026-06-10'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'death_report', '2026-06-25', 'pending', 'Death reported for 2026-06-25. Awaiting admin approval.', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '2026-06-26')
on conflict (id) do nothing;

insert into public.events (id, title, description, event_date, location, eligibility_wards, eligibility_types, min_age, min_disability_pct, priority_filter, created_by) values
  ('30000000-0000-0000-0000-000000000001', 'Ward 1 Priority Health Camp', 'Doctor visit and medicine review for high-priority elderly citizens.', '2026-07-05', 'Ward 1 Anganwadi Hall', array[1], array['elderly','both']::beneficiary_type[], 60, null, array['high']::priority_level[], '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', 'Assistive Device Distribution', 'Distribution and fitting support for wheelchairs, hearing aids and walking sticks.', '2026-07-12', 'Panchayat Community Hall', array[1,2], array['pwd','both']::beneficiary_type[], null, 40, array['high','medium']::priority_level[], '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', 'Pension Support Desk', 'Application and document correction help for elderly and PwD pension cases.', '2026-07-18', 'Panchayat Office', array[1,2], array['elderly','pwd','both']::beneficiary_type[], 60, null, array['high','medium','low']::priority_level[], '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;
