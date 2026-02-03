# PLAN.md - AdvanceMe AI → Quizlet-Style MVP Transformation

## Executive Summary

Transform AdvanceMe AI from an SAT-focused prep platform into a general-purpose study platform with Quizlet-style functionality. The MVP focuses on core flashcard creation, study modes, organization, and classroom features while leveraging existing infrastructure.

## Current State vs. Target State

| Feature | Current State | Target MVP State |
|---------|---------------|------------------|
| Flashcard Creation | Basic form | Import, rich editing, images |
| Study Modes | 5 modes (cards, learn, write, match, test) | Same + enhanced UX |
| Folders | Basic folders, user-only | Improved UX, visibility rules |
| Classes/Groups | StudyGroups exist (basic) | Full classroom workflow |
| Search/Discovery | None | Public set search |
| Sharing | Basic public/private | Share links, embed codes |
| Live Games | None | Join-code multiplayer |
| AI Features | Question generation | AI study guide generation |

## MVP Phases

---

## Phase 1: Foundation & Core Experience (Week 1-2)

### 1.1 Enhanced Flashcard Creation

**Goal:** Match Quizlet's set creation experience

**Tasks:**
- [ ] Create new set creation page (`/create` or `/sets/new`)
- [ ] Add term/definition language selection
- [ ] Implement card reordering (drag-and-drop)
- [ ] Add "insert card" at any position
- [ ] Add image upload to definitions (Firebase Storage)
- [ ] Create import from text modal (delimiter parsing)
  - Support: comma, tab, dash between term/definition
  - Support: semicolon, newline between cards
- [ ] Add keyboard shortcuts (Tab to next field, Enter to add card)
- [ ] Implement auto-save drafts

**Files to Create/Modify:**
- `src/app/(authenticated)/create/page.tsx` - New creation page
- `src/components/flashcards/SetCreator.tsx` - Creation form component
- `src/components/flashcards/CardEditor.tsx` - Individual card editor
- `src/components/flashcards/ImportModal.tsx` - Text import dialog
- `src/utils/flashcardImport.ts` - Parsing logic
- `src/types/flashcard.ts` - Add `termLanguage`, `definitionLanguage`, `imageUrl`

**API Routes:**
- `POST /api/flashcards/sets` - Create set
- `PUT /api/flashcards/sets/[id]` - Update set
- `POST /api/flashcards/upload-image` - Image upload

### 1.2 Improved Study Mode UX

**Goal:** Polish existing study modes to Quizlet standard

**Tasks:**
- [ ] Add Flashcards mode settings panel:
  - Front/back preference toggle
  - Shuffle toggle
  - Autoplay with speed control
  - Study starred only
  - Restart flashcards
- [ ] Enhance Learn mode:
  - Add goal setting (number of cards to master)
  - Show progress bar toward goal
  - Improve mastery visualization
- [ ] Enhance Match mode:
  - Add high score persistence to Firebase
  - Add leaderboard per set
- [ ] Add consistent navigation between modes
- [ ] Add "Study Again" flow at completion

**Files to Modify:**
- `src/components/flashcards/study/TermsList.tsx` - Add settings panel
- `src/components/flashcards/study/LearnMode.tsx` - Goal setting
- `src/components/flashcards/study/MatchMode.tsx` - Leaderboards
- `src/components/flashcards/StudyComplete.tsx` - New completion screen

### 1.3 Set Detail Page Redesign

**Goal:** Create Quizlet-style set landing page

**Tasks:**
- [ ] Create set detail page with sections:
  - Header (title, description, creator, stats)
  - Study mode buttons (Flashcards, Learn, Test, Match, Write)
  - Cards preview list
  - Share/embed buttons
  - Edit button (for owner)
- [ ] Add set statistics (cards count, times studied)
- [ ] Add "Add to folder" dropdown
- [ ] Add "Copy set" functionality

**Files to Create/Modify:**
- `src/app/(authenticated)/sets/[setId]/page.tsx` - Set detail page
- `src/components/flashcards/SetHeader.tsx` - Header component
- `src/components/flashcards/SetActions.tsx` - Action buttons
- `src/components/flashcards/CardPreviewList.tsx` - Cards list

---

## Phase 2: Organization & Discovery (Week 2-3)

### 2.1 Enhanced Folder System

**Goal:** Folders with visibility rules and better UX

**Tasks:**
- [ ] Add folder visibility logic:
  - Folder visible unless ALL contained sets are private
- [ ] Add folder description field
- [ ] Add folder tags/labels
- [ ] Implement add-to-folder from set page
- [ ] Add folder detail page with contained sets
- [ ] Add drag-and-drop set reordering in folders

**Files to Create/Modify:**
- `src/types/flashcard-folder.ts` - Add description, tags, visibility
- `src/app/(authenticated)/folders/[folderId]/page.tsx` - Folder detail
- `src/components/folders/FolderCard.tsx` - Enhanced folder card
- `src/services/flashcardFolderService.ts` - Visibility calculation

### 2.2 Search & Discovery

**Goal:** Users can find and study public sets

**Tasks:**
- [ ] Create search API endpoint
  - Full-text search on title, description, terms
  - Filter by subject/tags
  - Sort by relevance, popularity, recency
- [ ] Create search results page
- [ ] Add global search bar to navigation
- [ ] Create subject browse page
- [ ] Add "Popular Sets" section to home

**Files to Create:**
- `src/app/(authenticated)/search/page.tsx` - Search page
- `src/app/api/search/route.ts` - Search API
- `src/components/search/SearchBar.tsx` - Global search
- `src/components/search/SearchResults.tsx` - Results display
- `src/app/(authenticated)/browse/page.tsx` - Subject browsing

**Firestore:**
- Add composite indexes for search queries
- Consider Algolia/Typesense for better search (future)

### 2.3 Library & Home Dashboard

**Goal:** Logged-in landing with quick access

**Tasks:**
- [ ] Redesign authenticated home page:
  - Recent activity section
  - Continue studying section
  - Your sets section
  - Your folders section
  - Classes section
- [ ] Add "Recently studied" tracking
- [ ] Show study streak prominently
- [ ] Add quick-create button

**Files to Modify:**
- `src/app/(authenticated)/page.tsx` - Home redesign
- `src/components/dashboard/RecentActivity.tsx`
- `src/components/dashboard/ContinueStudying.tsx`
- `src/components/dashboard/QuickAccess.tsx`

---

## Phase 3: Classes & Teaching (Week 3-4)

### 3.1 Class System (Enhanced Study Groups)

**Goal:** Transform StudyGroups into Quizlet-style Classes

**Tasks:**
- [ ] Rename "Study Groups" to "Classes" in UI
- [ ] Add teacher/student role distinction:
  - Teachers can create classes
  - Teachers can add/remove sets
  - Students can join and study
- [ ] Add class join via link/code (already have invite codes)
- [ ] Add "school" field to classes
- [ ] Create class content tab (sets and folders)
- [ ] Add class progress tracking:
  - Per-student progress on assigned sets
  - Class-wide completion stats

**Files to Modify:**
- `src/types/study-group.ts` - Rename to `class.ts`, add teacher fields
- `src/services/studyGroupService.ts` - Rename to `classService.ts`
- `src/app/(authenticated)/classes/` - Rename routes
- `src/components/classes/ClassProgress.tsx` - New progress view
- `src/components/classes/ClassMembers.tsx` - Role display

### 3.2 Class Progress Dashboard

**Goal:** Teachers can track student progress

**Tasks:**
- [ ] Create progress tracking per student:
  - Which sets studied
  - Mastery level per set
  - Time spent
  - Last activity
- [ ] Create class dashboard view:
  - Overview stats (active students, completion rates)
  - Per-student progress table
  - Per-set completion breakdown
- [ ] Add export progress to CSV

**Files to Create:**
- `src/app/(authenticated)/classes/[classId]/progress/page.tsx`
- `src/components/classes/ProgressTable.tsx`
- `src/components/classes/StudentProgress.tsx`
- `src/api/firebase/classProgressRepository.ts`
- `src/types/class-progress.ts`

### 3.3 Adding Sets to Classes

**Goal:** Easy workflow for teachers to assign content

**Tasks:**
- [ ] Add "Add to class" option on set pages
- [ ] Add "Add set" button on class pages
- [ ] Show which classes contain a set
- [ ] Track when sets are added/removed
- [ ] When set removed, preserve historical progress

**Files to Modify:**
- `src/components/flashcards/SetActions.tsx` - Add to class
- `src/components/classes/ClassContent.tsx` - Add set button

---

## Phase 4: Sharing & Social (Week 4-5)

### 4.1 Enhanced Sharing

**Goal:** Easy sharing with proper visibility

**Tasks:**
- [ ] Create shareable URLs for:
  - Sets: `/sets/[id]`
  - Folders: `/folders/[id]`
  - Classes: `/classes/[id]/join`
- [ ] Add share modal with:
  - Copy link button
  - Social share buttons (Twitter, Facebook)
  - Embed code generator
- [ ] Add visibility controls:
  - Public (anyone can view/study)
  - Unlisted (link-only access)
  - Private (only owner)
- [ ] Create public set view for non-authenticated users

**Files to Create:**
- `src/components/sharing/ShareModal.tsx`
- `src/components/sharing/EmbedCode.tsx`
- `src/app/sets/[setId]/page.tsx` - Public set view
- `src/types/flashcard.ts` - Add `visibility: 'public' | 'unlisted' | 'private'`

### 4.2 Copy & Remix Sets

**Goal:** Users can copy public sets to their library

**Tasks:**
- [ ] Add "Copy to my library" button on public sets
- [ ] Create copy API that duplicates set
- [ ] Track original set reference (for attribution)
- [ ] Show "Copied from [username]" on copied sets

**Files to Create/Modify:**
- `src/app/api/flashcards/sets/[id]/copy/route.ts`
- `src/components/flashcards/CopySetButton.tsx`

### 4.3 User Profiles

**Goal:** Public profiles showing user's public content

**Tasks:**
- [ ] Create public profile page
- [ ] Show user's public sets
- [ ] Show user stats (sets created, cards)
- [ ] Add username to user model
- [ ] Add profile settings page

**Files to Create:**
- `src/app/users/[username]/page.tsx` - Public profile
- `src/app/(authenticated)/settings/profile/page.tsx`
- `src/types/user.ts` - User profile type

---

## Phase 5: Live Games MVP (Week 5-6)

### 5.1 Quizlet Live Clone (Basic)

**Goal:** Teacher-hosted live multiplayer study game

**Tasks:**
- [ ] Create Live game data model:
  - Game ID, host user, set ID, join code
  - Status: waiting, in-progress, completed
  - Players list with scores
  - Mode: individual or teams
- [ ] Create host flow:
  - Select set → Choose mode → Generate join code
  - Show lobby with joined players
  - Start game → Show questions → End with results
- [ ] Create player flow:
  - Enter join code → Enter name → Wait in lobby
  - Answer questions → See results
- [ ] Use Firebase Realtime Database for live sync
- [ ] Create join page at `/live`

**Files to Create:**
- `src/types/live-game.ts` - Game data model
- `src/app/(authenticated)/live/host/page.tsx` - Host flow
- `src/app/live/page.tsx` - Join page (public)
- `src/app/live/[joinCode]/page.tsx` - Game room
- `src/components/live/HostLobby.tsx`
- `src/components/live/PlayerLobby.tsx`
- `src/components/live/GameQuestion.tsx`
- `src/components/live/GameResults.tsx`
- `src/services/liveGameService.ts`
- `src/config/firebase-realtime.ts` - Realtime DB config

### 5.2 Individual Mode

**Goal:** Basic individual competitive mode

**Tasks:**
- [ ] Each player answers all questions
- [ ] Track time per answer
- [ ] Score based on correctness + speed
- [ ] Show live leaderboard during game
- [ ] Display final rankings

### 5.3 Teams Mode (Stretch)

**Goal:** Collaborative team-based mode

**Tasks:**
- [ ] Auto-assign players to teams (2-4 per team)
- [ ] Each team member gets different answer options
- [ ] Team must collaborate to find correct answer
- [ ] Track team scores

---

## Phase 6: AI Features (Week 6-7)

### 6.1 AI Study Guide Generation

**Goal:** Generate study content from user materials

**Tasks:**
- [ ] Create study guide input page:
  - Text paste input
  - File upload (PDF, DOCX, TXT)
- [ ] Create AI generation endpoint:
  - Parse uploaded content
  - Generate outline/summary
  - Generate flashcard set from content
  - Generate practice questions
- [ ] Create study guide view page
- [ ] Allow editing generated content

**Files to Create:**
- `src/app/(authenticated)/study-guides/create/page.tsx`
- `src/app/api/ai/study-guide/route.ts`
- `src/lib/ai/study-guide-generation.ts`
- `src/types/study-guide.ts`
- `src/components/study-guides/StudyGuideEditor.tsx`

### 6.2 AI Tutor Chat (Q-Chat Style)

**Goal:** Chat interface tied to study content

**Tasks:**
- [ ] Create chat UI component
- [ ] Create chat API with context injection
- [ ] Add chat button to set detail pages
- [ ] Include disclaimer about AI limitations
- [ ] Add report mechanism for bad responses

**Files to Create:**
- `src/components/ai/TutorChat.tsx`
- `src/app/api/ai/chat/route.ts`
- `src/lib/ai/tutor-chat.ts`

---

## Data Model Changes Summary

### New/Modified Types

```typescript
// src/types/flashcard.ts - MODIFIED
interface FlashcardSet {
  // ... existing fields
  visibility: 'public' | 'unlisted' | 'private'; // was: isPublic
  termLanguage?: string;
  definitionLanguage?: string;
  copiedFromSetId?: string;
  copiedFromUserId?: string;
  timesStudied?: number;
  subjects?: string[];
}

interface Flashcard {
  // ... existing fields
  termImageUrl?: string;
  definitionImageUrl?: string;
  termAudioUrl?: string;
  definitionAudioUrl?: string;
}

// src/types/class.ts - RENAMED from study-group.ts
interface Class {
  id: string;
  name: string;
  description?: string;
  school?: string;
  ownerId: string; // teacher
  adminIds: string[];
  memberIds: string[]; // students
  inviteCode: string;
  setIds: string[];
  folderIds?: string[];
  createdAt: number;
  updatedAt: number;
}

// src/types/class-progress.ts - NEW
interface StudentProgress {
  userId: string;
  classId: string;
  setProgress: {
    [setId: string]: {
      masteryLevel: number; // 0-100
      cardsStudied: number;
      lastStudiedAt: number;
    };
  };
}

// src/types/live-game.ts - NEW
interface LiveGame {
  id: string;
  joinCode: string;
  hostUserId: string;
  setId: string;
  mode: 'individual' | 'teams';
  status: 'waiting' | 'in-progress' | 'completed';
  players: LivePlayer[];
  teams?: LiveTeam[];
  currentQuestionIndex: number;
  startedAt?: number;
  endedAt?: number;
}

// src/types/study-guide.ts - NEW
interface StudyGuide {
  id: string;
  userId: string;
  title: string;
  sourceText?: string;
  sourceFileUrl?: string;
  outline: OutlineSection[];
  generatedSetId?: string;
  practiceQuestions?: PracticeQuestion[];
  createdAt: number;
  updatedAt: number;
}

// src/types/user.ts - NEW
interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  role: 'student' | 'teacher';
  subscription?: 'free' | 'plus';
  createdAt: number;
}
```

---

## API Routes Summary

### New Routes to Create

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/flashcards/sets` | Create flashcard set |
| PUT | `/api/flashcards/sets/[id]` | Update set |
| GET | `/api/flashcards/sets/[id]` | Get set (public) |
| POST | `/api/flashcards/sets/[id]/copy` | Copy set to library |
| POST | `/api/flashcards/upload-image` | Upload card image |
| GET | `/api/search` | Search public sets |
| POST | `/api/classes` | Create class (teacher) |
| PUT | `/api/classes/[id]` | Update class |
| GET | `/api/classes/[id]` | Get class |
| POST | `/api/classes/[id]/join` | Join class |
| GET | `/api/classes/[id]/progress` | Get class progress |
| POST | `/api/live/games` | Create live game |
| GET | `/api/live/games/[code]` | Get game by join code |
| POST | `/api/live/games/[code]/join` | Join game |
| POST | `/api/ai/study-guide` | Generate study guide |
| POST | `/api/ai/chat` | AI tutor chat |
| GET | `/api/users/[username]` | Get public profile |

---

## UI/UX Priorities

1. **Mobile-first responsive design** - Many students use phones
2. **Keyboard navigation** - Power users expect shortcuts
3. **Fast load times** - Lazy load study modes
4. **Offline capability** - Cache sets for offline study (PWA)
5. **Accessibility** - Screen reader support, high contrast

---

## Success Metrics

### Phase 1-2 (Core)
- Users can create sets with 10+ cards in under 2 minutes
- Import success rate > 95% for properly formatted text
- Study session completion rate > 70%

### Phase 3-4 (Classes)
- Teachers can create class and add students in under 5 minutes
- Student engagement rate in assigned sets > 60%
- Class progress dashboard load time < 2 seconds

### Phase 5-6 (Live & AI)
- Live game join success rate > 95%
- Game latency < 500ms for state updates
- AI study guide generation < 30 seconds

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Firebase costs at scale | Implement aggressive caching, rate limiting |
| Search performance | Start simple, plan Algolia migration path |
| Live game scalability | Use Realtime DB, limit to 50 players/game |
| AI costs | Rate limit per user, cache common responses |
| Scope creep | Strict MVP feature cut-off, defer premium features |

---

## Out of Scope for MVP

- Diagram sets (labeled images)
- Document scanning (OCR)
- Rich text formatting (bold/italic)
- Subscription/payment system
- Mobile native apps
- Offline PWA mode
- Audio pronunciation
- Multi-language interface
- Admin/moderation tools
- Analytics dashboard
- Email notifications
- SSO (Google Classroom, etc.)

---

## Next Steps

1. Review and prioritize phases
2. Create GitHub issues for Phase 1 tasks
3. Set up feature branches per phase
4. Begin Phase 1 implementation
5. User testing after each phase

---

*Last updated: 2026-02-03*
