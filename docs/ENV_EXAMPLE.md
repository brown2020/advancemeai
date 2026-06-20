### Public (exposed to browser)

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase Console setup: enable Google, Email/Password, and Email link sign-in.
# Add local + production domains to Authorized domains and email action URLs.

### Optional app flags

NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_ALLOW_TEST_MODE=false

### Server-only (NOT exposed to browser)

# Required only if you want HttpOnly Firebase Admin sessions and server-side verification

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Use literal \n for line breaks; keep the surrounding quotes

FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR-PRIVATE-KEY-CONTENT\n-----END PRIVATE KEY-----\n"

# Equivalent server-only alternatives are also supported:
# - FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY
# - FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_JSON with the full service-account JSON
# - FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 or FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 with base64-encoded JSON
# - FIREBASE_ADMIN_SERVICE_ACCOUNT, FIREBASE_SERVICE_ACCOUNT, FIREBASE_ADMIN_CREDENTIALS,
#   or GOOGLE_APPLICATION_CREDENTIALS_JSON as JSON/base64 JSON aliases

### Optional: OpenAI key (for AI question generation)

OPENAI_API_KEY=sk-your-openai-api-key
