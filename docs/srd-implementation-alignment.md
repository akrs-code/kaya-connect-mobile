# Kaya-Connect SRD Implementation Alignment Review

## Review basis and status legend

This is a static implementation review of the SRD dated November 2026 against
the source code in this repository. It is not a substitute for executing every
test on a deployed environment, device, or production-like dataset.

| Status | Meaning |
|---|---|
| Implemented | The requirement has a corresponding API/domain implementation with relevant validation or access control. |
| Partial | A portion is implemented, but a stated behavior, user interface, security control, or acceptance criterion is missing or unproven. |
| Not implemented | No corresponding system capability was found, or the feature is deliberately out of scope. |
| Not verifiable from source | The requirement depends on measurement, deployment configuration, or manual evaluation evidence not available in the repository. |

## Functional requirements

| ID | Requirement | Status | Evidence and gap |
|---|---|---|---|
| FR-001 | User registration | Implemented | `AuthService.register` validates unique email, hashes the password, creates the user/profile, and returns a session. |
| FR-002 | User authentication | Implemented | `AuthService.login` verifies Argon2id hashes, rejects inactive users, and issues tokens. |
| FR-003 | User logout | Implemented | `AuthService.logout` deletes the hashed refresh-token record; the client clears its local session on logout. |
| FR-004 | Profile management | Implemented | Authenticated endpoints update the account name and upsert the associated profile using Zod validation. |
| FR-005 | Skills and experience management | Implemented | Profiles persist skills, experience, availability, service area, portfolio, and intent. |
| FR-006 | Profile visibility | Implemented | Public-profile responses omit email/credentials and honour visibility flags for experience, availability, and portfolio. |
| FR-007 | Create opportunity | Implemented | The API validates title, description, category, location, schedule, type, and compensation before creating a draft/published listing. |
| FR-008 | Edit and close listing | Implemented | Only the owner can change an eligible draft/published listing; close declines pending applications. |
| FR-009 | Opportunity type classification | Implemented | The schema and DTO constrain listings to `gig`, `freelance`, `part_time`, or `volunteer`. |
| FR-010 | Browse and search opportunities | Implemented | Published, unexpired opportunities can be keyword searched via a MongoDB text index. |
| FR-011 | Filter opportunities | Implemented | Listing query supports category, type, area, compensation type, and schedule date range. |
| FR-012 | View opportunity details | Implemented | The details endpoint exposes permitted task, schedule, location, qualification, compensation, and status information. |
| FR-013 | Recommended opportunities | Not implemented | Automated recommendations are intentionally out of scope. The application supports browse, search, and filters only. |
| FR-014 | Recommended providers | Partial | A requester can inspect actual applicants and public profiles, but no rule-based provider matching, ranking, or recommendation endpoint exists. |
| FR-015 | Submit application | Implemented | The service checks listing status, ownership, provider intent, and the unique active-application constraint. |
| FR-016 | Manage own applications | Implemented | Providers can list applications and withdraw only a submitted application. |
| FR-017 | Review applicants | Implemented | Listing owners can access submitted/selected applications; related public-profile and review endpoints support manual assessment. |
| FR-018 | Select applicant | Implemented | A MongoDB transaction conditionally assigns the listing, selects one application, declines the rest, creates the assignment, and logs the action. |
| FR-019 | Notify relevant users | Implemented | Notification records are created for applications, selection, agreement, assignment, payment, review, report, and moderation events. |
| FR-020 | Private messaging | Implemented | Application-linked conversations restrict access to participants; messages support text and one validated photo attachment. |
| FR-021 | Confirm task agreement | Implemented | Agreement versions and separate requester/provider confirmations are enforced before the `agreed` state. |
| FR-022 | Record agreement changes | Implemented | A new proposal increments the version, clears prior provider confirmation, and requires renewed confirmation. |
| FR-023 | View assignment details | Implemented | Assignment access is restricted to its requester/provider; unrelated users receive a not-found response. |
| FR-024 | Track task status | Implemented | Server-side state-transition checks control the assignment lifecycle. |
| FR-025 | Confirm task completion | Implemented | The provider reports completion and the requester confirms or raises a concern; each action is recorded separately. |
| FR-026 | Record payment acknowledgment | Implemented | The system records requester declaration and provider receipt confirmation separately for paid assignments only. |
| FR-027 | Submit mutual reviews | Implemented | Only completed-assignment participants can review each other; a unique index prevents duplicate reviews. |
| FR-028 | View reviews and assignment history | Implemented | Visible reviews and a limited completed-assignment history are exposed without private agreement/message data. |
| FR-029 | Report user or content | Implemented | Users can report `user` and `opportunity` targets with category, description, and duplicate-open-report protection. |
| FR-030 | Review and moderate reports | Implemented | Admin-only report workflow, listing removal, account actions, review hiding, appeals, and audit logging are present. |
| FR-031 | Manage categories and rules | Partial | Admins can create, list, and update categories. No general platform-settings/rules management capability was found. |

### Functional design work needed

1. **Revise the SRD:** remove or mark FR-013 as out of scope and revise FR-014
   to describe manual applicant review rather than automated provider
   recommendation.
2. **Decide whether provider matching is needed:** if yes, design matching
   criteria, explanation text, endpoint(s), ranking rules, empty-state behavior,
   and tests. If not, remove both recommendation requirements and their related
   traceability entries.
3. **Define administrative settings:** either reduce FR-031 to category
   management or define which settings require an admin UI, API, validation,
   audit records, and authorization.

## Non-functional requirements

| ID | Requirement | Status | Evidence and gap |
|---|---|---|---|
| NFR-001 | API response time | Not verifiable from source | No benchmark, APM metric, or pilot performance result was found. |
| NFR-002 | Search performance | Not verifiable from source | A MongoDB text index exists, but the three-second target has not been measured. |
| NFR-003 | Recommendation performance | Not implemented | Recommendations are out of scope; remove this requirement with FR-013/FR-014. |
| NFR-004 | Concurrent usage | Not verifiable from source | No 10-user load-test script or result was found. |
| NFR-005 | Image handling | Implemented | Uploads enforce one file, 5 MB limit, MIME allow-list, magic-byte verification, and asynchronous Cloudinary handling. |
| NFR-006 | Secure authentication | Implemented | Passwords use Argon2id; refresh tokens are stored only as SHA-256 hashes. |
| NFR-007 | Authorization | Implemented | Global JWT/role guards plus ownership, participant, and admin checks are implemented in services. |
| NFR-008 | Secure communication | Partial | The API can be deployed behind HTTPS, but source configuration includes HTTP development defaults and does not enforce HTTPS itself. Prove TLS at deployment. |
| NFR-009 | Input validation | Implemented | Zod DTOs, ObjectId validation, NoSQL guard, service rules, and state-machine checks validate server input. |
| NFR-010 | Data privacy | Implemented | Public profiles omit private credentials/contact data; conversations, assignments, and admin views are access controlled. |
| NFR-011 | File upload security | Implemented | MIME, 5 MB, magic-byte, and Cloudinary allowed-format checks block arbitrary executable uploads. |
| NFR-012 | Administrative accountability | Implemented | Audit events include actor, event type, target, metadata, and timestamp for critical workflow/moderation actions. |
| NFR-013 | Session protection | Partial | Refresh tokens expire, rotate, and can be revoked. On web, tokens reside in `localStorage`; native uses an in-memory fallback rather than secure persistent storage. |
| NFR-014 | Consistent interface | Not verifiable from source | Shared UI components exist, but this needs a screen-by-screen visual review. |
| NFR-015 | Clear feedback | Partial | API/client have normalized errors and several empty/error states; major workflows still need manual UX acceptance checks. |
| NFR-016 | Mobile usability | Not verifiable from source | No device-test results or usability evaluation were found. |
| NFR-017 | Task clarity | Partial | API returns the required details; verify all relevant details/statuses are clearly rendered before commitment in the mobile UI. |
| NFR-018 | Accessible presentation | Not verifiable from source | No accessibility audit, contrast results, or screen-reader/touch-target test evidence was found. |
| NFR-019 | Error handling | Implemented | Global exception filtering and client `ApiError` handling provide normalized errors without exposing server stacks. |
| NFR-020 | Data consistency | Implemented | Applicant selection is transactional; unique indexes and conditional state updates protect key transitions. |
| NFR-021 | Deployment availability | Not verifiable from source | No uptime target measurement or monitoring evidence was found. |
| NFR-022 | Data backup | Not implemented | No database backup configuration, manual backup procedure, or recovery-test evidence was found. |
| NFR-023 | Recovery | Not implemented | No documented application/database recovery procedure was found. |
| NFR-024 | Modular design | Implemented | Frontend API/UI modules and NestJS feature modules separate controllers, DTOs, services, and schemas. |
| NFR-025 | Code documentation | Partial | Swagger, code comments, READMEs, and architecture documentation exist; environment, deployment, backup/recovery, and full endpoint documentation remain incomplete. |
| NFR-026 | Version control | Partial | A Git repository exists. Verify repository access rules and secret-scanning; this review does not establish that no secret was ever committed. |
| NFR-027 | Configuration management | Implemented | The backend validates environment variables and the client reads the API base URL from an Expo public variable. |
| NFR-028 | Testability | Implemented | Business logic is service-based and has unit/e2e test files, including state-machine, DTO, media, report, and selection coverage. |
| NFR-029 | Mobile compatibility | Not verifiable from source | No recorded Android device/OS compatibility test matrix was found. |
| NFR-030 | Cross-platform compatibility | Partial | Expo targets iOS/web/Android, but no iOS validation evidence was found. |
| NFR-031 | Backend compatibility | Partial | The Node/Nest toolchain is specified in dependencies, but no selected-host runtime validation record was found. |
| NFR-032 | Database compatibility | Partial | The Mongoose/MongoDB stack is configured and schema tests exist; verify against the selected managed MongoDB deployment. |
| NFR-033 | Network resilience | Partial | The client catches network errors and avoids treating failed requests as success, but no offline/retry UX test evidence was found. |
| NFR-034 | Data minimization | Partial | The data model appears purpose-driven, but no documented data inventory/necessity review exists. |
| NFR-035 | Consent and notice | Not implemented | No privacy notice, consent flow, or in-app explanation of profile visibility/feedback practices was found. |
| NFR-036 | Feedback integrity | Implemented | Reviews require a completed assignment and a participating reviewer; they are stored as user feedback, not payment/identity verification. |
| NFR-037 | Data retention | Not implemented | No retention/deletion policy or procedure for accounts, messages, reports, and assignments was found. |

## Other SRD alignment finding: local organizations

The SRD recognizes local organizations as stakeholders, but the data model and
use cases treat them through an authorized requester representative. The current
system supports that same basic model: a normal user can post as a requester.
It does **not** have an `Organization` entity, membership/delegation roles,
organization-owned listings, or organization-level audit history. This is not a
defect if a single representative account is your intended pilot scope; it
becomes a functional gap only if organizations need multiple staff members or
separate ownership.

## Recommended implementation order

1. Update the SRD to remove recommendation requirements and clarify whether
   “organization” means a representative user account or a real organization
   tenant.
2. Add native secure token storage and document the web token-storage risk.
3. Add a privacy/consent notice and a retention/deletion policy.
4. Create and test backup and recovery procedures.
5. Produce evidence for performance, concurrent usage, availability, Android/iOS
   compatibility, accessibility, and usability requirements.
6. If retained, design either administrator-managed platform settings or narrow
   FR-031 to category management.
