# Functional Specification: Quizlet Web Experience

## 1) Product scope and principles

Quizlet is a study platform centered on “study content” (primarily flashcard sets) with multiple study activities layered on top, plus teacher workflows for organizing content into classes and running live classroom games. The web experience supports anonymous discovery, authenticated study and creation, subscription upsells, and teacher-only features like classes and class progress tracking. ([Quizlet Help Center][1])

Because Quizlet blocks automated crawling of many core pages (403/robots), this spec is grounded in Quizlet’s publicly accessible Help Center and other accessible public pages, and it models the observable product behavior described there. ([Quizlet Help Center][1])

## 2) Core entities and data model

### 2.1 User

A user account represents an individual learner or teacher.

Required fields
UserId, email (or auth provider id), username, display name, region/country, language, createdAt, updatedAt.

Role and capability fields
role: {student, teacher}. Some creation actions are teacher-only (notably classes). ([Quizlet Help Center][2])
subscription: {free, plus_student, plus_teacher, schools?} with expiry, renewal flags. ([Quizlet Help Center][3])
age/consent flags to gate certain features such as folder creation for younger users. ([Quizlet Help Center][4])

### 2.2 Study content types

StudyContent is a polymorphic parent used for discovery, organization (folders/classes), and studying.

FlashcardSet
setId, title, description, subjects/tags, languageTerm, languageDefinition, visibility {public, unlisted, private}, ownerUserId, createdAt, updatedAt. ([Quizlet Help Center][5])
cards: ordered list of Card.

Card
cardId, termRichText, definitionRichText, termMedia (image/audio), definitionMedia (image/audio), starredByUser (per-user). Rich text formatting is subscriber-gated in sets. ([Quizlet Help Center][5])

DiagramSet (specialized FlashcardSet)
A diagram set is based on one image with labeled terms (and optional definitions). This feature is subscription-gated. ([Quizlet Help Center][6])

StudyGuide (AI-powered content)
A study guide is generated from uploaded/pasted course materials and includes an outline, a flashcard set, and related study artifacts. It is subscription-gated with limited free access trials. ([Quizlet Help Center][7])

### 2.3 Organization types

Folder
folderId, title, description, ownerUserId, visibility (derived: visible unless all contained sets are private), tags/labels, createdAt, updatedAt. ([Quizlet Help Center][4])
contents: references to StudyContent with type+id.

Class (teacher-owned)
classId, name, description, school, ownerUserId, admins (userIds), members (userIds), join policy, createdAt, updatedAt. Only teachers can create classes. ([Quizlet Help Center][2])
classContents: references to sets and optionally folders (folder-in-class is gated to subscribers/teachers). ([Quizlet Help Center][8])

### 2.4 Activity and progress

StudySession
sessionId, userId (nullable for anonymous), contentId, mode, startedAt, endedAt, deviceType, settings snapshot.

Per-user progress
For Learn: mastery state per card, goal state, attempt history. Learn is subscriber-gated. ([Quizlet Help Center][9])
For classes: class progress visibility depends on sets assigned to a class, removing a set stops class progress reporting. ([Quizlet Help Center][10])

LiveGame
gameId, hostUserId, mode {classic_teams, classic_individuals, blast}, setId(s), joinCode, status, players, teams/groups, startedAt, endedAt. Join happens via quizlet.live with a join code. ([Quizlet Help Center][11])

## 3) Key routes and navigation

### 3.1 Public routes (no login required)

Discovery and marketing pages (home, features, pricing) plus Help Center. Help Center explicitly lists major product areas and links to “Flashcards, Test, Learn, Solutions, Study Guides, Live” and subscriptions. ([Quizlet Help Center][1])

Live join page
`/live` join flow is reachable via quizlet.live, where a player enters a join code and a name, then joins a running game. ([Quizlet Help Center][11])

### 3.2 Authenticated routes

Create shortcut
`https://quizlet.new` opens set creation. ([Quizlet Help Center][5])

Account areas
Home (logged-in landing), library surfaces (sets, folders, classes), profile, settings, subscription/upgrade flows. The Help Center and subscription articles imply these standard areas. ([Quizlet Help Center][1])

## 4) Authentication and account lifecycle

### 4.1 Sign up / log in

Users must create an account or log in to join a class. ([Quizlet Help Center][1])
Teachers can self-identify as teachers during signup to unlock teacher workflows like starting Quizlet Live and creating classes. ([Quizlet Help Center][12])

### 4.2 Email verification, password reset, account changes

Help Center includes flows like resending confirmation, changing username/password. Implement standard email verification and password reset with rate limits and abuse controls. ([Quizlet Help Center][1])

### 4.3 Age/consent gating

If the user is under the required age, they may be unable to create folders until reaching their region’s age of consent. ([Quizlet Help Center][4])

## 5) Content creation and editing

### 5.1 Create a flashcard set

Entry points
Global “Create” action and `quizlet.new` shortcut. ([Quizlet Help Center][5])

Create form fields
Title, description, term language, definition language, cards list with term/definition inputs, optional images, optional audio. ([Quizlet Help Center][5])

Card list behaviors
Add a card at the end or insert in the middle by selecting a card and tapping “+”. ([Quizlet Help Center][5])
Show suggested terms while typing, with a toggle to disable suggestions. ([Quizlet Help Center][5])
Support special characters and symbol keyboards via “Choose Language” including Chemistry and Math symbols. ([Quizlet Help Center][5])

Visibility and publishing
Published sets are public by default, and the user can change visibility later. ([Quizlet Help Center][5])

Subscriber-gated formatting
Subscribers can bold/italic/underline/highlight within sets. ([Quizlet Help Center][5])

### 5.2 Add images

Allow adding images to definitions by upload or selecting from a free gallery. ([Quizlet Help Center][5])

### 5.3 Import to create sets

Users can import terms/definitions from a document using delimiter rules (comma, tab, dash between term/definition; semicolon or newline between rows). Each row becomes a card. ([Quizlet Help Center][13])

### 5.4 Scan a document to create cards

Within set creation, offer “Scan document” that uses camera or photo library, detects text regions, lets users pick detected terms/definitions, and populates cards. This is subscription-gated. ([Quizlet Help Center][14])

### 5.5 Diagram sets

Diagram sets are built from one image with labeled terms and optional definitions, subscription-gated. Creation starts from Create → Flashcard set, then diagram-specific flow to upload/select base image and place labels. ([Quizlet Help Center][6])

### 5.6 Edit, copy, and draft behavior

Provide edit flows for owners, draft sets, and copy-and-edit for non-owners (where permitted). The Help Center enumerates these capabilities in the “Creating, editing, and saving sets” section. ([Quizlet Help Center][15])

## 6) Studying experiences

### 6.1 Flashcards mode

Flashcards is a mode for reviewing cards. Provide options for showing definitions first, shuffling, autoplay (“Play”), and studying starred terms with an “Options” menu and a “Restart Flashcards” flow. ([Quizlet Help Center][16])

Settings to support
Front/back preference, shuffle, autoplay speed, starred-only subset, sorting toggles, restart round. ([Quizlet Help Center][16])

### 6.2 Learn mode (personalized path)

Learn creates a personalized study path based on user goals and familiarity, built on learning science principles and machine learning. Learn is available only to Quizlet Plus and Quizlet Plus for teachers subscribers. ([Quizlet Help Center][9])

Functional requirements
The user starts Learn from a set, selects goal/quantity (where applicable), then progresses through adaptive prompts (e.g., multiple choice, typed response) driven by mastery states. Persist mastery per card and overall completion state. Gate access and show upsell when unsubscribed. ([Quizlet Help Center][9])

### 6.3 Match game

Match shows a subset of pairs per game (six pairs) and supports diagram sets where users match definitions to locations. Options allow restricting pair types for diagram sets. ([Quizlet Help Center][17])

Functional requirements
Timer-based gameplay, per-game scoring/time, leaderboards/high scores (where offered), repeated rounds to cover larger sets. ([Quizlet Help Center][17])

### 6.4 Study Guides (AI-powered)

Users upload or paste course materials to generate a study guide “equipped with an outline, flashcard set, and more” and can edit/tailor it. This feature is subscription-gated with limited free access trials. ([Quizlet Help Center][7])

Generation inputs
Text paste and file upload (at minimum), plus metadata like title and subject.

Generation outputs
Outline sections, derived flashcard set, and attached study artifacts (practice questions, summaries), editable by the user. ([Quizlet Help Center][7])

### 6.5 Practice Tests

Practice Tests let users choose number of questions, question type, and time limit, currently available for study material in sciences and humanities. Practice Tests are subscription-gated with limited free access trials. ([Quizlet Help Center][18])

### 6.6 Expert Solutions

Expert Solutions provide step-by-step textbook and question solutions written and verified by experts. ([Quizlet Help Center][18])

### 6.7 Q-Chat / AI tutor

Quizlet positions Q-Chat as an AI tutor experience associated with study materials and Study Guides/Magic Notes content, and it includes safety disclaimers about potential incorrect/problematic content and reporting. ([Quizlet][19])

Functional requirements
A chat UI tied to a specific source (a set or a study guide). The model context includes the study material. The user asks questions, receives responses, and can follow up. Include a visible disclaimer and a report mechanism for problematic outputs. ([Quizlet][19])

## 7) Organization: folders and library

### 7.1 Folders

Users can create folders to organize study content and add content into folders from folder views and from set “More” menus. Folders are visible to others unless all contained sets are private. Folders can be tagged. ([Quizlet Help Center][4])

Functional requirements
Create/edit/delete folder. Add/remove content references with type filtering. Tag folders. Enforce age/consent gating for folder creation. ([Quizlet Help Center][4])

### 7.2 Logged-in home and library

The Help Center indicates users manage sets, folders, classes, profile, and settings from their logged-in experience. Implement a home dashboard that surfaces recent study activity and quick access to sets/folders/classes. ([Quizlet Help Center][1])

## 8) Teaching: classes and classroom workflows

### 8.1 Class creation and management

Classes help teachers organize sets, share them with students, and track progress. Only teachers can create classes. Owners/admins can edit class info (title, description, school) and delete classes. ([Quizlet Help Center][2])

Functional requirements
Teacher-only “Create class”. Class detail page with membership controls, content tab, and class progress tab (where available). Admin roles within class. Delete is irreversible. ([Quizlet Help Center][2])

### 8.2 Adding sets to a class

Teachers can add sets to a class from the class page or from a set page via “More → Add to class or folder”. Removing a set stops showing Class Progress; re-adding resumes. ([Quizlet Help Center][10])

### 8.3 Class folders

Quizlet Plus for teachers and Quizlet Plus subscribers can add folders to classes they own, and only class creator/administrator can add folders. ([Quizlet Help Center][8])

### 8.4 Quizlet Live

Classic Quizlet Live supports teams mode and individuals mode. Teachers start games from the website (not within the app), players can join from mobile devices. Joining a game uses the Quizlet Live page, join code, then player name. ([Quizlet Help Center][12])

Host flow (teacher)
Select a set, choose Live mode (teams/individual), configure options, generate join code, show join lobby with roster, start the game, display live progress and results.

Player flow
Go to quizlet.live, enter join code, enter name, join, wait for start, play rounds until completion. ([Quizlet Help Center][11])

Blast (live grouping variant)
Blast supports joining via join code and optionally QR code in-app, then assigns players to groups. ([Quizlet Help Center][20])

## 9) Sharing and embedding

### 9.1 Sharing links

Every public set, folder, class, or study guide must have a canonical share URL, plus sharing controls based on visibility.

### 9.2 Embedding sets

Quizlet supports embedding sets into external websites. Provide embed code generation (iframe or script) and enforce visibility rules (private content not embeddable). ([Quizlet Help Center][21])

## 10) Subscription, paywalls, and upsells

### 10.1 Subscription types

Quizlet offers Quizlet Plus (students) and Quizlet Plus for teachers, with premium access to advanced study tools like Learn, Study Guides, and Expert Solutions, and teacher-specific capabilities like formative assessment and student progress tracking. ([Quizlet Help Center][3])

### 10.2 Feature gating rules (minimum)

Learn requires subscription (Plus or Plus for teachers). ([Quizlet Help Center][9])
Study Guides require subscription with limited free access trials. ([Quizlet Help Center][18])
Diagram sets are subscription-gated. ([Quizlet Help Center][6])
Scan document is subscription-gated. ([Quizlet Help Center][14])
Rich text formatting in sets is subscription-gated. ([Quizlet Help Center][5])
Class folders require Plus for teachers or Plus subscribers. ([Quizlet Help Center][8])

### 10.3 Upsell interactions

When a free user attempts a gated feature, present a paywall with plan comparison, benefits, and a subscribe CTA. When a teacher is identified, show teacher-specific upgrade messaging. ([Quizlet Help Center][3])

## 11) Search and discovery

### 11.1 Finding flashcard sets and classes

Help Center indicates users can find flashcard sets and find a teacher’s class, with joining requiring login. ([Quizlet Help Center][1])

Functional requirements
A global search bar that returns sets, study guides (where public), classes (discoverable by join link or limited directory), and subjects. Ranking should consider relevance, popularity, recency, and language match.

### 11.2 Subject browsing

Quizlet exposes browsing by subject categories (implied by the public homepage listing subjects). Implement subject taxonomy and subject landing pages.

## 12) Non-functional requirements

### 12.1 Platform support

Quizlet is accessible across devices, with web and mobile flows for Live joining and studying. Implement responsive layouts and mobile-friendly interactions. ([Quizlet Help Center][11])

### 12.2 Safety, integrity, and abuse controls

For AI features, display an explicit disclaimer that outputs may be incorrect or problematic and provide reporting flows. ([Quizlet][19])
For Live join pages, block personal information entry in player names, and moderate inappropriate names with filters. ([Quizlet Help Center][20])

### 12.3 Privacy and visibility enforcement

Respect visibility settings across sharing, embedding, folder visibility derivation, and class membership. Folders are visible unless all contained sets are private. ([Quizlet Help Center][4])

## 13) Minimum API surface (engineering-oriented)

Auth
POST /auth/signup, POST /auth/login, POST /auth/logout, POST /auth/password-reset, POST /auth/verify-email.

Content
POST /sets, PUT /sets/{id}, GET /sets/{id}, POST /sets/{id}/copy, POST /sets/import, POST /sets/scan (subscriber), POST /diagram-sets (subscriber). ([Quizlet Help Center][13])

Study
POST /study-sessions, POST /learn/{setId}/start (subscriber), POST /learn/{setId}/answer, GET /learn/{setId}/progress. ([Quizlet Help Center][9])

Folders
POST /folders, PUT /folders/{id}, POST /folders/{id}/items, DELETE /folders/{id}/items/{itemId}. ([Quizlet Help Center][4])

Classes (teacher-only create)
POST /classes (teacher), PUT /classes/{id}, POST /classes/{id}/members, POST /classes/{id}/sets, DELETE /classes/{id}/sets/{setId}. ([Quizlet Help Center][2])

Live
POST /live/games (teacher host), GET /live/games/{joinCode}, POST /live/games/{joinCode}/join, POST /live/games/{gameId}/start, POST /live/games/{gameId}/answer. ([Quizlet Help Center][11])

AI
POST /study-guides/generate (subscriber/limited trial), PUT /study-guides/{id}, POST /qchat (chat tied to content), POST /ai/report. ([Quizlet Help Center][7])

Billing
GET /plans, POST /subscribe, POST /cancel, GET /subscription/status. ([Quizlet Help Center][3])

## 14) Acceptance criteria by pillar

Creation
A user can create a set from scratch, import a set from a delimited document, and add images from upload or gallery. ([Quizlet Help Center][5])

Studying
A user can study a set in Flashcards mode with shuffle, autoplay, and starred-only behavior. ([Quizlet Help Center][16])
A subscribed user can run Learn and see adaptive progression and saved progress. ([Quizlet Help Center][9])
A user can play Match, including diagram-set match behaviors. ([Quizlet Help Center][17])

Organization
A user can create folders (unless age-gated), tag them, add/remove study content, and folder visibility follows the “all private sets means private” rule. ([Quizlet Help Center][4])

Teaching
A teacher can create/manage a class, add sets, and removing a set stops class progress reporting. ([Quizlet Help Center][2])
A teacher can start a Classic Live game on web and students can join via quizlet.live using a join code and name. ([Quizlet Help Center][12])

AI Study
A subscribed user can generate a Study Guide from pasted/uploaded materials and edit the resulting guide and derived study artifacts. ([Quizlet Help Center][7])
A user can access an AI tutor chat tied to their study material with a visible disclaimer and reporting. ([Quizlet][19])

[1]: https://help.quizlet.com/hc/en-us?utm_source=chatgpt.com "Quizlet Help Center"
[2]: https://help.quizlet.com/hc/en-us/articles/360031160932-Guide-Managing-classes?utm_source=chatgpt.com "Guide: Managing classes - Quizlet Help Center"
[3]: https://help.quizlet.com/hc/en-us/articles/360041181691-Subscribing-to-Quizlet?utm_source=chatgpt.com "Subscribing to Quizlet - Quizlet Help Center"
[4]: https://help.quizlet.com/hc/en-us/articles/360030986151-Organizing-study-content-with-folders?utm_source=chatgpt.com "Organizing study content with folders – Quizlet Help Center"
[5]: https://help.quizlet.com/hc/en-us/articles/360029780752-Creating-flashcard-sets?utm_source=chatgpt.com "Creating flashcard sets - Quizlet Help Center"
[6]: https://help.quizlet.com/hc/en-us/articles/360029631292-Creating-diagram-sets?utm_source=chatgpt.com "Creating diagram sets - Quizlet Help Center"
[7]: https://help.quizlet.com/hc/en-us/articles/18312306436365-Studying-with-Study-Guides?utm_source=chatgpt.com "Studying with Study Guides - Quizlet Help Center"
[8]: https://help.quizlet.com/hc/en-us/articles/360049850051-Organizing-sets-in-a-class-with-folders?utm_source=chatgpt.com "Organizing sets in a class with folders - Quizlet Help Center"
[9]: https://help.quizlet.com/hc/en-us/articles/360030986971-Studying-with-Learn?utm_source=chatgpt.com "Studying with Learn - Quizlet Help Center"
[10]: https://help.quizlet.com/hc/en-us/articles/360035357412-Adding-sets-to-a-class?utm_source=chatgpt.com "Adding sets to a class - Quizlet Help Center"
[11]: https://help.quizlet.com/hc/en-us/articles/360030955952-Joining-a-game-of-Classic-Quizlet-Live?utm_source=chatgpt.com "Joining a game of Classic Quizlet Live - Quizlet Help Center"
[12]: https://help.quizlet.com/hc/en-us/articles/360030985431-Starting-a-game-of-Classic-Quizlet-Live-in-teams-mode?utm_source=chatgpt.com "Starting a game of Classic Quizlet Live in teams mode"
[13]: https://help.quizlet.com/hc/en-us/articles/360029977151-Creating-sets-by-importing-content?utm_source=chatgpt.com "Creating sets by importing content – Quizlet Help Center"
[14]: https://help.quizlet.com/hc/en-us/articles/360030936511-Creating-a-set-by-scanning-a-document?utm_source=chatgpt.com "Creating a set by scanning a document – Quizlet Help Center"
[15]: https://help.quizlet.com/hc/en-us/sections/360004698771-Creating-editing-and-saving-sets?utm_source=chatgpt.com "Creating, editing, and saving sets – Quizlet Help Center"
[16]: https://help.quizlet.com/hc/en-us/articles/360030988091-Studying-with-Flashcards?utm_source=chatgpt.com "Studying with Flashcards - Quizlet Help Center"
[17]: https://help.quizlet.com/hc/en-us/articles/360031183611-Playing-Match?utm_source=chatgpt.com "Playing Match - Quizlet Help Center"
[18]: https://help.quizlet.com/hc/en-us/articles/360030841732-Studying-on-Quizlet?utm_source=chatgpt.com "Studying on Quizlet – Quizlet Help Center"
[19]: https://quizlet.com/study-guides/accessing-q-chat-on-quizlet-b70e1b93-4f0e-4ec5-af6a-1588ff6b234a?utm_source=chatgpt.com "Accessing Q Chat on Quizlet"
[20]: https://help.quizlet.com/hc/en-us/articles/27393733229965-Playing-a-game-of-Blast?utm_source=chatgpt.com "Playing a game of Blast - Quizlet Help Center"
[21]: https://help.quizlet.com/hc/en-us/articles/360032935851-Embedding-sets?utm_source=chatgpt.com "Embedding sets - Quizlet Help Center"
