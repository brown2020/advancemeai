# Service Architecture

This directory contains service modules that handle data fetching, caching, and business logic for different features of the application. Each service is responsible for a specific domain and provides a clean API for components to interact with.

## Service Structure

Each service follows a similar pattern:

1. **Types**: Define the data types used by the service
2. **Cache Configuration**: Set up caching for performance optimization
3. **Helper Functions**: Internal utility functions
4. **Public API**: Exported functions for components to use

## Available Services

### Flashcard Service (`flashcardService.ts`)

Handles all operations related to flashcards:

- Fetching flashcard sets
- Creating, updating, and deleting flashcard sets
- Caching flashcard data for performance
- Managing public vs. private flashcard sets

### Quiz Service (`quizService.ts`)

Handles all operations related to quizzes:

- Fetching quizzes
- Creating, updating, and deleting quizzes
- Caching quiz data for performance
- Managing user-specific quizzes

### Practice Test Service (`practiceTestService.ts`)

Handles all operations related to practice tests:

- Fetching test sections and questions
- Submitting test attempts
- Tracking user progress
- Caching test data for performance

## Best Practices

When working with services:

1. **Use the service API**: Components should never directly access API endpoints or manage caching logic. Always use the service functions.

2. **Keep components clean**: Components should focus on UI rendering and user interactions, delegating data fetching and business logic to services.

3. **Error handling**: Services handle error cases and provide meaningful error messages. Components should display these errors to users.

4. **Caching**: Services manage caching to optimize performance. This includes cache invalidation when data changes.

5. **Type safety**: All service functions are strongly typed to ensure type safety throughout the application.

## Adding a New Service

To add a new service:

1. Create a new file in the `services` directory with a descriptive name (e.g., `userService.ts`)
2. Define the types for the service
3. Set up caching if needed
4. Implement the service functions
5. Export the public API
6. Document the service in this README

## Example Usage

```tsx
// In a component
import { getUserFlashcards } from "@/services/flashcardService";

function FlashcardList() {
  const [flashcards, setFlashcards] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await getUserFlashcards(userId);
      setFlashcards(data);
    }
    fetchData();
  }, [userId]);

  // Render the flashcards
}
```
