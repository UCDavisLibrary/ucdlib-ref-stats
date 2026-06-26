<general-instructions>Create a sql or bash file (05-initial-hydration) that fills in data based on the schema files found in this directory, and the specifications listed in this file. This file automatically gets ingested by Postgres container if database is empty. If you believe there are any spelling mistakes or data issues, please let me know before generating the file.</general-instructions>


<form_definitions>
  <form_definition>
    <form_name>reference</form_name>
    <form_label>Reference Transactions/Consultations</form_label>
    <form_description>Record research assistance, information consultations, resource recommendations, and instruction in using information resources.
    </form_description>
    <form_intro>
      <p>Reference entries may represent either individual transactions recorded in real time or multiple transactions entered retrospectively. Therefore, the system should allow users to specify the number of transactions represented by a single entry.</p>
      <p><strong>Count:</strong> research assistance, information consultations, resource recommendations instruction in using information resources</p>
      <p><strong>Do NOT count: </strong>questions about hours directions, policies, printing, or basic equipment assistance (i.e., directional)</p>
    </form_intro>
    <edit-interval>7 days</edit-interval>
  </form_definition>
  <form_definition>
    <form_name>instruction</form_name>
    <form_label>Instruction Sessions/Presentations to Groups</form_label>
    <form_description>Record planned instructional and educational activities sponsored by the Library, including course-integrated instruction, workshops, orientations, tours, and presentations delivered in person or virtually.
    </form_description>
    <form_intro>
      <p>Use this form to record planned instructional and educational activities sponsored by the Library, including course-integrated instruction, workshops, orientations, tours, and presentations delivered in person or virtually.</p>
      <p><strong>Count:</strong> planned instructional sessions, orientations, workshops, tours, and presentations sponsored by the Library, whether delivered in person or virtually</p>
      <p><strong>Do NOT count: </strong>internal Library personnel training sessions or meetings that are not instructional activities for Library users</p>
      <p>Note: Personal, one-to-one or small-group/research team instruction in using sources should be reported through the Reference Transactions/Consultations form.</p>
    </form_intro>
    <edit-interval>7 days</edit-interval>
  </form_definition>
  <form_definition>
    <form_name>outreach</form_name>
    <form_label>Outreach</form_label>
    <form_description>Record Library-sponsored outreach and engagement activities intended to increase awareness of Library services, foster relationships, and advance the Library's land-grant mission outside of formal instructional settings.
    </form_description>
    <form_intro>
      <p>Use this form to record Library-sponsored outreach and engagement activities intended to increase awareness of Library services, foster relationships, and advance the Library's land-grant mission outside of formal instructional settings.</p>
      <p><strong>Count:</strong> tabling events, resource fairs, open houses, community engagement activities, promotional events highlighting Library services and resources, other non-instructional activities designed to connect with campus or community audiences</p>
      <p><strong>Do NOT count: </strong>reference interactions reported through the Reference Transactions/Consultations form; workshops, orientations, tours, or other planned presentations to groups reported through the Instruction Sessions form; internal Library meetings or staff training activities</p>
    </form_intro>
    <edit-interval>7 days</edit-interval>
  </form_definition>
</form_definitions>

<picklist_definitions>
  <default-picklist-option-value-instructions>
      For all picklist options create value from label by lowercasing and replacing spaces and slashes with hyphens
  </default-picklist-option-value-instructions>
  <picklist_definition>
    <picklist_label>UC Davis Constituency</picklist_label>
    <picklist_name>ucd-constituency</picklist_name>
    <picklist_options>
      <picklist_option>Undergraduate students</picklist_option>
      <picklist_option>Graduate/Professional students</picklist_option>
      <picklist_option>Postdocs/visiting scholars</picklist_option>
      <picklist_option>Faculty</picklist_option>
      <picklist_option>Staff</picklist_option>
      <picklist_option>Residents/fellows</picklist_option>
      <picklist_option>Prospective students/families</picklist_option>
      <picklist_option>Alumni/donors</picklist_option>
      <picklist_option>Community members</picklist_option>
      <picklist_option>K-12 students</picklist_option>
      <picklist_option>Multiple audiences</picklist_option>
      <picklist_option>Other</picklist_option>
    </picklist_options>
  </picklist_definition>
  <picklist_definition>
    <picklist_label>Instruction Session Type</picklist_label>
    <picklist_name>instruction-session-type</picklist_name>
    <picklist_options>
      <picklist_option>Course-related or -integrated instruction</picklist_option>
      <picklist_option>Workshop</picklist_option>
      <picklist_option>Presentation/lecture</picklist_option>
      <picklist_option>Orientation</picklist_option>
      <picklist_option>Tour</picklist_option>
      <picklist_option>Other</picklist_option>
    </picklist_options>
  </picklist_definition>
  <picklist_definition>
    <picklist_label>Outreach Type</picklist_label>
    <picklist_name>outreach-type</picklist_name>
    <picklist_options>
      <picklist_option>Tabling Event</picklist_option>
      <picklist_option>Resource fair</picklist_option>
      <picklist_option>Open house</picklist_option>
      <picklist_option>Community engagement activity</picklist_option>
      <picklist_option>Promotional event</picklist_option>
      <picklist_option>Other</picklist_option>
    </picklist_options>
  </picklist_definition>
  <picklist_definition>
    <picklist_label>Reference Topic</picklist_label>
    <picklist_name>reference-topic</picklist_name>
    <picklist_options>
      <picklist_option>Coursework/assignment</picklist_option>
      <picklist_option>Research project</picklist_option>
      <picklist_option>Publication/scholarly communication</picklist_option>
      <picklist_option>Grant/funding proposal</picklist_option>
      <picklist_option>Teaching/course design</picklist_option>
      <picklist_option>Data/GIS/digital scholarship</picklist_option>
      <picklist_option>Citation management</picklist_option>
      <picklist_option>Other</picklist_option>
    </picklist_options>
  </picklist_definition>
</picklist_definitions>

<fields-and-field-assignment>
  <field-definition>
    <field-label>Event Date</field-label>
    <field-name>event-date</field-name>
    <field-type>date</field-type>
    <field-assignments>
      <field-assignment>
        <form>reference</form>
        <label>Date of interaction(s)</label>
        <required>true</required>
        <default>today's date</default>
      </field-assignment>
      <field-assignment>
        <form>instruction</form>
        <label>Date of session</label>
        <required>true</required>
        <default>today's date</default>
      </field-assignment>
      <field-assignment>
        <form>outreach</form>
        <label>Date of activity</label>
        <required>true</required>
        <default>today's date</default>
      </field-assignment>
    </field-assignments>
  </field-definition>
  <field-definition>
    <field-label>Number of Events/Transactions</field-label>
    <field-name>event-count</field-name>
    <field-type>number</field-type>
    <field-assignments>
      <field-assignment>
        <form>reference</form>
        <label>Number of reference transactions</label>
        <required>true</required>
        <default>1</default>
        <description>Enter the number of reference transactions represented by this submission. For retrospective entry, multiple transactions may be reported together.</description>
      </field-assignment>
      <field-assignment>
        <form>instruction</form>
        <label>Number of presentations</label>
        <required>true</required>
        <default>1</default>
        <description>Enter the number of instructional sessions represented by this submission. Multi-session courses should be reported as one presentation per meeting/session.</description>
      </field-assignment>
      <field-assignment>
        <form>outreach</form>
        <label>Number of outreach activities</label>
        <required>true</required>
        <default>1</default>
        <description>Enter the number of outreach activities represented by this submission. Multiple activities may be entered retrospectively if needed.</description>
      </field-assignment>
    </field-assignments>
  </field-definition>
  <field-definition>
    <field-label>Number of Virtual Events/Transactions</field-label>
    <field-name>virtual-event-count</field-name>
    <field-type>number</field-type>
    <field-assignments>
      <field-assignment>
        <form>reference</form>
        <label>Number of virtual reference transactions</label>
        <required>true</required>
        <default>0</default>
        <description>Enter the number of transactions conducted via email, chat, web forms, or other electronic methods. This number cannot exceed the total number of reference transactions.</description>
      </field-assignment>
      <field-assignment>
        <form>instruction</form>
        <label>Virtual sessions(s)</label>
        <required>true</required>
        <default>0</default>
        <description>Enter the number of presentations delivered virtually. This number cannot exceed the total number of presentations.</description>
      </field-assignment>
    </field-assignments>
  </field-definition>
  <field-definition>
    <field-label>Number of People</field-label>
    <field-name>person-count</field-name>
    <field-type>number</field-type>
    <field-assignments>
      <field-assignment>
        <form>reference</form>
        <label>Number of individuals consulted</label>
        <required>true</required>
        <default>1</default>
        <description>Enter the number of individuals served. For group consultations, record one transaction and indicate the total number of users consulted</description>
      </field-assignment>
      <field-assignment>
        <form>instruction</form>
        <label>Number of participants</label>
        <required>true</required>
        <default>0</default>
        <description>Enter the number of participants attending the session(s) represented by this submission. Special circumstances related to participant counting may be addressed in the Notes field.</description>
      </field-assignment>
      <field-assignment>
        <form>outreach</form>
        <label>Number of participants reached</label>
        <required>true</required>
        <default>0</default>
        <description>Enter the number of individuals engaged through the activity. Estimates are acceptable when exact counts are unavailable.</description>
      </field-assignment>
    </field-assignments>
  </field-definition>
  <field-definition>
    <field-label>UC Davis Constituency</field-label>
    <field-name>ucd-constituency</field-name>
    <field-type>select</field-type>
    <picklist>ucd-constituency</picklist>
    <field-assignments>
      <field-assignment>
        <form>reference</form>
        <label>User type (if known)</label>
        <required>false</required>
      </field-assignment>
      <field-assignment>
        <form>outreach</form>
        <label>Intended audience</label>
        <required>true</required>
        <description>Select the choice that represents the primary intended audience for this activity</description>
      </field-assignment>
    </field-assignments>
  </field-definition>
  <field-definition>
    <field-label>Notes</field-label>
    <field-name>notes</field-name>
    <field-type>textarea</field-type>
    <field-assignments>
      <field-assignment>
        <form>instruction</form>
        <required>false</required>
        <description>Use this field to document exceptional situations (e.g., estimated attendance, co-taught sessions, or other circumstances not captured elsewhere on the form)</description>
      </field-assignment>
      <field-assignment>
        <form>outreach</form>
        <required>false</required>
      </field-assignment>
    </field-assignments>
  </field-definition>
</fields-and-field-assignment>