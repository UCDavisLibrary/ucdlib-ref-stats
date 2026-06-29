-- ============================================================
-- 05-initial-hydration.sql
-- Initial data seed. Auto-ingested by the Postgres container
-- when the database is empty.
-- ============================================================

-- 1. Groups
INSERT INTO groups (group_id, name) VALUES
  (25, 'Research and Health Sciences'),
  (24, 'Academic Engagement and Learning');


-- 2. Forms
INSERT INTO form (form_id, name, label, description, intro, edit_interval_amount, edit_interval_unit, form_display_settings)
VALUES (
  gen_random_uuid(),
  'reference',
  'Reference Transactions/Consultations',
  'Record research assistance, information consultations, resource recommendations, and instruction in using information resources.',
  '<p>Reference entries may represent either individual transactions recorded in real time or multiple transactions entered retrospectively. Therefore, the system should allow users to specify the number of transactions represented by a single entry.</p>
<p><strong>Count:</strong> research assistance, information consultations, resource recommendations instruction in using information resources</p>
<p><strong>Do NOT count: </strong>questions about hours directions, policies, printing, or basic equipment assistance (i.e., directional)</p>',
  7,
  'days',
  jsonb_build_object('brandColor', 'putah-creek', 'queryElementFields', jsonb_build_array(
    jsonb_build_object('field', 'event-date',          'desktopFr', 1, 'mobileFr', 1),
    jsonb_build_object('field', 'event-count',         'desktopFr', 1, 'mobileFr', 1),
    jsonb_build_object('field', 'virtual-event-count', 'desktopFr', 1),
    jsonb_build_object('field', 'person-count',        'desktopFr', 1, 'mobileFr', 1),
    jsonb_build_object('field', 'ucd-constituency'),
    jsonb_build_object('field', 'event-duration')
  ))
);

INSERT INTO form (form_id, name, label, description, intro, edit_interval_amount, edit_interval_unit, form_display_settings)
VALUES (
  gen_random_uuid(),
  'instruction',
  'Instruction Sessions/Presentations to Groups',
  'Record planned instructional and educational activities sponsored by the Library, including course-integrated instruction, workshops, orientations, tours, and presentations delivered in person or virtually.',
  '<p>Use this form to record planned instructional and educational activities sponsored by the Library, including course-integrated instruction, workshops, orientations, tours, and presentations delivered in person or virtually.</p>
<p><strong>Count:</strong> planned instructional sessions, orientations, workshops, tours, and presentations sponsored by the Library, whether delivered in person or virtually</p>
<p><strong>Do NOT count: </strong>internal Library personnel training sessions or meetings that are not instructional activities for Library users</p>
<p>Note: Personal, one-to-one or small-group/research team instruction in using sources should be reported through the Reference Transactions/Consultations form.</p>',
  7,
  'days',
  jsonb_build_object('brandColor', 'pinot', 'queryElementFields', jsonb_build_array(
    jsonb_build_object('field', 'event-date',                'desktopFr', 1, 'mobileFr', 1),
    jsonb_build_object('field', 'instruction-session-title', 'desktopFr', 3, 'mobileFr', 3),
    jsonb_build_object('field', 'event-count',               'desktopFr', 1),
    jsonb_build_object('field', 'person-count',              'desktopFr', 1),
    jsonb_build_object('field', 'virtual-event-count'),
    jsonb_build_object('field', 'instruction-session-type'),
    jsonb_build_object('field', 'event-duration')
  ))
);

INSERT INTO form (form_id, name, label, description, intro, edit_interval_amount, edit_interval_unit, form_display_settings)
VALUES (
  gen_random_uuid(),
  'outreach',
  'Outreach',
  'Record Library-sponsored outreach and engagement activities intended to increase awareness of Library services, foster relationships, and advance the Library''s land-grant mission outside of formal instructional settings.',
  '<p>Use this form to record Library-sponsored outreach and engagement activities intended to increase awareness of Library services, foster relationships, and advance the Library''s land-grant mission outside of formal instructional settings.</p>
<p><strong>Count:</strong> tabling events, resource fairs, open houses, community engagement activities, promotional events highlighting Library services and resources, other non-instructional activities designed to connect with campus or community audiences</p>
<p><strong>Do NOT count: </strong>reference interactions reported through the Reference Transactions/Consultations form; workshops, orientations, tours, or other planned presentations to groups reported through the Instruction Sessions form; internal Library meetings or staff training activities</p>',
  7,
  'days',
  jsonb_build_object('brandColor', 'redbud', 'queryElementFields', jsonb_build_array(
    jsonb_build_object('field', 'event-date',                'desktopFr', 1, 'mobileFr', 1),
    jsonb_build_object('field', 'ucd-constituency',          'desktopFr', 3, 'mobileFr', 3),
    jsonb_build_object('field', 'event-count',               'desktopFr', 1),
    jsonb_build_object('field', 'person-count',              'desktopFr', 1),
    jsonb_build_object('field', 'outreach-type'),
    jsonb_build_object('field', 'ucd-community-organization')
  ))
);


-- 3. Picklists
INSERT INTO picklist (picklist_id, name, label)
VALUES
  (gen_random_uuid(), 'ucd-constituency',        'UC Davis Constituency'),
  (gen_random_uuid(), 'instruction-session-type', 'Instruction Session Type'),
  (gen_random_uuid(), 'outreach-type',            'Outreach Type'),
  (gen_random_uuid(), 'reference-topic',          'Reference Topic');


-- 4. Picklist items

INSERT INTO picklist_item (picklist_item_id, picklist_id, value, label, sort_order)
VALUES
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'undergraduate-students',         'Undergraduate students',         0),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'graduate-professional-students',  'Graduate/Professional students',  1),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'postdocs-visiting-scholars',      'Postdocs/visiting scholars',      2),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'faculty',                         'Faculty',                         3),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'staff',                           'Staff',                           4),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'residents-fellows',               'Residents/fellows',               5),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'prospective-students-families',   'Prospective students/families',   6),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'alumni-donors',                   'Alumni/donors',                   7),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'community-members',               'Community members',               8),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'k-12-students',                   'K-12 students',                   9),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'multiple-audiences',              'Multiple audiences',              10),
  (gen_random_uuid(), get_picklist_id('ucd-constituency'), 'other',                           'Other',                           11);

INSERT INTO picklist_item (picklist_item_id, picklist_id, value, label, sort_order)
VALUES
  (gen_random_uuid(), get_picklist_id('instruction-session-type'), 'course-related-or-integrated-instruction', 'Course-related or -integrated instruction', 0),
  (gen_random_uuid(), get_picklist_id('instruction-session-type'), 'workshop',             'Workshop',             1),
  (gen_random_uuid(), get_picklist_id('instruction-session-type'), 'presentation-lecture', 'Presentation/lecture', 2),
  (gen_random_uuid(), get_picklist_id('instruction-session-type'), 'orientation',          'Orientation',          3),
  (gen_random_uuid(), get_picklist_id('instruction-session-type'), 'tour',                 'Tour',                 4),
  (gen_random_uuid(), get_picklist_id('instruction-session-type'), 'other',                'Other',                5);

INSERT INTO picklist_item (picklist_item_id, picklist_id, value, label, sort_order)
VALUES
  (gen_random_uuid(), get_picklist_id('outreach-type'), 'tabling-event',               'Tabling Event',               0),
  (gen_random_uuid(), get_picklist_id('outreach-type'), 'resource-fair',               'Resource fair',               1),
  (gen_random_uuid(), get_picklist_id('outreach-type'), 'open-house',                  'Open house',                  2),
  (gen_random_uuid(), get_picklist_id('outreach-type'), 'community-engagement-activity', 'Community engagement activity', 3),
  (gen_random_uuid(), get_picklist_id('outreach-type'), 'promotional-event',           'Promotional event',           4),
  (gen_random_uuid(), get_picklist_id('outreach-type'), 'other',                       'Other',                       5);

INSERT INTO picklist_item (picklist_item_id, picklist_id, value, label, sort_order)
VALUES
  (gen_random_uuid(), get_picklist_id('reference-topic'), 'coursework-assignment',               'Coursework/assignment',               0),
  (gen_random_uuid(), get_picklist_id('reference-topic'), 'research-project',                    'Research project',                    1),
  (gen_random_uuid(), get_picklist_id('reference-topic'), 'publication-scholarly-communication', 'Publication/scholarly communication',  2),
  (gen_random_uuid(), get_picklist_id('reference-topic'), 'grant-funding-proposal',              'Grant/funding proposal',              3),
  (gen_random_uuid(), get_picklist_id('reference-topic'), 'teaching-course-design',              'Teaching/course design',              4),
  (gen_random_uuid(), get_picklist_id('reference-topic'), 'data-gis-digital-scholarship',        'Data/GIS/digital scholarship',        5),
  (gen_random_uuid(), get_picklist_id('reference-topic'), 'citation-management',                 'Citation management',                 6),
  (gen_random_uuid(), get_picklist_id('reference-topic'), 'other',                               'Other',                               7);


-- 5. Form fields (no picklist)
INSERT INTO form_field (form_field_id, name, label, field_type)
VALUES
  (gen_random_uuid(), 'event-date',                'Event/Transaction Date',               'date'),
  (gen_random_uuid(), 'event-count',               'Number of Events/Transactions',        'number'),
  (gen_random_uuid(), 'virtual-event-count',       'Number of Virtual Events/Transactions', 'number'),
  (gen_random_uuid(), 'person-count',              'Number of People',                     'number'),
  (gen_random_uuid(), 'event-duration',            'Event/Transaction Duration',            'number'),
  (gen_random_uuid(), 'notes',                     'Notes',                                'textarea'),
  (gen_random_uuid(), 'instruction-session-title', 'Instruction Session Title',             'textarea'),
  (gen_random_uuid(), 'ucd-community-organization', 'UC Davis or Community Organization',  'textarea');

-- Form fields (with picklist)
INSERT INTO form_field (form_field_id, name, label, field_type, picklist_id)
VALUES
  (gen_random_uuid(), 'ucd-constituency',        'UC Davis Constituency',    'select', get_picklist_id('ucd-constituency')),
  (gen_random_uuid(), 'instruction-session-type', 'Instruction Session Type', 'select', get_picklist_id('instruction-session-type')),
  (gen_random_uuid(), 'outreach-type',           'Outreach Type',            'select', get_picklist_id('outreach-type')),
  (gen_random_uuid(), 'reference-topic',         'Reference Topic',          'select', get_picklist_id('reference-topic'));


-- 6. Form field assignments

-- reference form (7 fields)
INSERT INTO form_field_assignment (form_field_assignment_id, form_id, form_field_id, sort_order, assignment_settings)
VALUES
  (gen_random_uuid(), get_form_id('reference'), get_form_field_id('event-date'), 0,
    jsonb_build_object('required', true, 'label', 'Date of interaction(s)', 'defaultValue', 'today')),
  (gen_random_uuid(), get_form_id('reference'), get_form_field_id('event-count'), 1,
    jsonb_build_object('required', true, 'label', 'Number of reference transactions', 'defaultValue', '1',
      'description', 'Enter the number of reference transactions represented by this submission. For retrospective entry, multiple transactions may be reported together.')),
  (gen_random_uuid(), get_form_id('reference'), get_form_field_id('virtual-event-count'), 2,
    jsonb_build_object('required', true, 'label', 'Number of virtual reference transactions', 'defaultValue', '0',
      'description', 'Enter the number of transactions conducted via email, chat, web forms, or other electronic methods. This number cannot exceed the total number of reference transactions.')),
  (gen_random_uuid(), get_form_id('reference'), get_form_field_id('person-count'), 3,
    jsonb_build_object('required', true, 'label', 'Number of individuals consulted', 'defaultValue', '1',
      'description', 'Enter the number of individuals served. For group consultations, record one transaction and indicate the total number of users consulted')),
  (gen_random_uuid(), get_form_id('reference'), get_form_field_id('ucd-constituency'), 4,
    jsonb_build_object('required', false, 'label', 'User type (if known)')),
  (gen_random_uuid(), get_form_id('reference'), get_form_field_id('reference-topic'), 5,
    jsonb_build_object('required', true, 'conditionalOnGroup', jsonb_build_array(25))),
  (gen_random_uuid(), get_form_id('reference'), get_form_field_id('event-duration'), 6,
    jsonb_build_object('required', true, 'label', 'Time spent on transaction',
      'description', 'In minutes. Including preparation and follow-up', 'conditionalOnGroup', jsonb_build_array(24)));

-- instruction form (8 fields)
INSERT INTO form_field_assignment (form_field_assignment_id, form_id, form_field_id, sort_order, assignment_settings)
VALUES
  (gen_random_uuid(), get_form_id('instruction'), get_form_field_id('event-date'), 0,
    jsonb_build_object('required', true, 'label', 'Date of session', 'defaultValue', 'today')),
  (gen_random_uuid(), get_form_id('instruction'), get_form_field_id('event-count'), 1,
    jsonb_build_object('required', true, 'label', 'Number of presentations', 'defaultValue', '1',
      'description', 'Enter the number of instructional sessions represented by this submission. Multi-session courses should be reported as one presentation per meeting/session.')),
  (gen_random_uuid(), get_form_id('instruction'), get_form_field_id('virtual-event-count'), 2,
    jsonb_build_object('required', true, 'label', 'Virtual sessions(s)', 'defaultValue', '0',
      'description', 'Enter the number of presentations delivered virtually. This number cannot exceed the total number of presentations.')),
  (gen_random_uuid(), get_form_id('instruction'), get_form_field_id('person-count'), 3,
    jsonb_build_object('required', true, 'label', 'Number of participants', 'defaultValue', '0',
      'description', 'Enter the number of participants attending the session(s) represented by this submission. Special circumstances related to participant counting may be addressed in the Notes field.')),
  (gen_random_uuid(), get_form_id('instruction'), get_form_field_id('instruction-session-type'), 4,
    jsonb_build_object('required', false, 'label', 'Session Type')),
  (gen_random_uuid(), get_form_id('instruction'), get_form_field_id('instruction-session-title'), 5,
    jsonb_build_object('required', false, 'label', 'Instructional Session Title')),
  (gen_random_uuid(), get_form_id('instruction'), get_form_field_id('notes'), 6,
    jsonb_build_object('required', false, 'rows', 5,
      'description', 'Use this field to document exceptional situations (e.g., estimated attendance, co-taught sessions, or other circumstances not captured elsewhere on the form)')),
  (gen_random_uuid(), get_form_id('instruction'), get_form_field_id('event-duration'), 7,
    jsonb_build_object('required', true, 'label', 'Time spent on instructional session',
      'description', 'In minutes. Including preparation and follow-up', 'conditionalOnGroup', jsonb_build_array(24)));

-- outreach form (7 fields)
INSERT INTO form_field_assignment (form_field_assignment_id, form_id, form_field_id, sort_order, assignment_settings)
VALUES
  (gen_random_uuid(), get_form_id('outreach'), get_form_field_id('event-date'), 0,
    jsonb_build_object('required', true, 'label', 'Date of activity', 'defaultValue', 'today')),
  (gen_random_uuid(), get_form_id('outreach'), get_form_field_id('event-count'), 1,
    jsonb_build_object('required', true, 'label', 'Number of outreach activities', 'defaultValue', '1',
      'description', 'Enter the number of outreach activities represented by this submission. Multiple activities may be entered retrospectively if needed.')),
  (gen_random_uuid(), get_form_id('outreach'), get_form_field_id('person-count'), 2,
    jsonb_build_object('required', true, 'label', 'Number of participants reached', 'defaultValue', '0',
      'description', 'Enter the number of individuals engaged through the activity. Estimates are acceptable when exact counts are unavailable.')),
  (gen_random_uuid(), get_form_id('outreach'), get_form_field_id('ucd-constituency'), 3,
    jsonb_build_object('required', true, 'label', 'Intended audience',
      'description', 'Select the choice that represents the primary intended audience for this activity')),
  (gen_random_uuid(), get_form_id('outreach'), get_form_field_id('outreach-type'), 4,
    jsonb_build_object('required', false)),
  (gen_random_uuid(), get_form_id('outreach'), get_form_field_id('ucd-community-organization'), 5,
    jsonb_build_object('required', false, 'label', 'Campus or community partner(s)')),
  (gen_random_uuid(), get_form_id('outreach'), get_form_field_id('notes'), 6,
    jsonb_build_object('required', false, 'rows', 5));
