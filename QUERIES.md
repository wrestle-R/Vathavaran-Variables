# Vathavaran Query Documentation

This document explains how the Firestore database queries work in the Vathavaran environment variable management system.

## Database Structure

The application uses Firebase Firestore to store environment files in a collection called `envFiles`. Each document has the following structure:

```javascript
{
  userId: Number,           // GitHub user ID of the person who pushed the file
  userName: String,         // GitHub username of the person who pushed the file
  repoFullName: String,     // Full repository name (e.g., "owner/repo-name")
  repoName: String,         // Repository name only (e.g., "repo-name")
  directory: String,        // Directory path within the repo (empty string for root)
  envName: String,          // Name of the environment file
  content: String,          // Encrypted content of the .env file
  isEncrypted: Boolean,     // Always true (content is always encrypted)
  createdAt: String,        // ISO timestamp of creation
  updatedAt: String         // ISO timestamp of last update
}
```

## Query Operations

### 1. PUSH Operation (`/api/env/push`)

**Purpose**: Upload an encrypted environment file to the database.

**Authentication**: Required - user must have push access to the repository.

**Query Type**: INSERT (Firestore `POST` to `/envFiles`)

**Validation**:
- Verifies the user has push access to the repository via GitHub API
- Checks repository exists and user permissions

**Data Stored**:
```javascript
{
  userId: auth.user.id,              // Authenticated user's GitHub ID
  userName: auth.user.login,         // Authenticated user's GitHub username
  repoFullName: "owner/repo",        // From request body
  repoName: "repo",                  // From request body or extracted from repoFullName
  directory: "backend",              // From request body (can be empty string)
  envName: ".env.production",        // From request body
  content: "encrypted...",           // Encrypted content from CLI
  isEncrypted: true,                 // Always true
  createdAt: "2025-12-01T...",      // Current timestamp
  updatedAt: "2025-12-01T..."       // Current timestamp
}
```

**Example**:
```bash
varte push -o wrestle-R -r BitNBuild-25_TeamCotton -d backend
```

---

### 2. PULL Operation (`/api/env/pull`)

**Purpose**: Retrieve all environment files for a specific repository and directory.

**Authentication**: Required - but no ownership check.

**Query Type**: SELECT with filters

**Query Logic**:
```javascript
// Filters by repository and directory only (NOT by userId)
WHERE repoFullName = "owner/repo" 
  AND directory = "backend"
```

**Why it works for collaborators**:
- The query does NOT filter by `userId`
- It only filters by `repoFullName` and `directory`
- This means ALL users can see ALL environment files for a repository, regardless of who uploaded them
- This enables true collaboration - any team member can access env files pushed by other team members

**Example**:
```bash
# You (wrestle-R) can pull files that gavin100305 pushed
varte pull -o wrestle-R -r BitNBuild-25_TeamCotton -d backend

# The query will return files from ANY user for this repo+directory
```

**Response**:
- Returns an array of matching env files
- User selects which file to download
- File is decrypted locally using the encryption key

---

### 3. LIST Operation (`/api/env/list`)

**Purpose**: List environment files. Behavior depends on whether a repository is specified.

**Authentication**: Required

**Query Type**: SELECT with conditional filtering

#### Scenario A: List without repository filter
```bash
varte list
```

**Query Logic**:
```javascript
// Shows only YOUR files across ALL repositories
WHERE userId = auth.user.id
```

**Result**: You see only files YOU uploaded, across all your repositories.

#### Scenario B: List with repository filter
```bash
varte list -o wrestle-R -r BitNBuild-25_TeamCotton
```

**Query Logic**:
```javascript
// Shows ALL files for the specified repository (from any user)
WHERE repoFullName = "wrestle-R/BitNBuild-25_TeamCotton"
```

**Result**: You see files from ALL collaborators for that specific repository.

**Why this design?**
- Default view (`varte list`) shows only your files to avoid clutter
- Filtered view (`varte list -o X -r Y`) shows all collaborator files to enable team visibility
- This balances personal organization with team collaboration

---

## Common Use Cases

### Scenario 1: Team Member Pushed File, I Can't See It

**Problem**: 
- Gavin pushed `.env.01/12/2025T14:32 (gavin100305)` to `wrestle-R/BitNBuild-25_TeamCotton` in the `backend` directory
- You run `varte pull` but don't see it

**Old Behavior** (❌ Before fix):
- Pull query filtered by `userId` AND `repoFullName`
- You could only see YOUR OWN files

**New Behavior** (✅ After fix):
- Pull query filters ONLY by `repoFullName` and `directory`
- You can see files from ALL collaborators

**Solution**:
```bash
# Pull from the repo and directory
varte pull -o wrestle-R -r BitNBuild-25_TeamCotton -d backend

# You'll now see Gavin's file in the selection list
# Select it and it will be decrypted and saved locally
```

---

### Scenario 2: Listing All Team Files

**Problem**: Want to see what env files exist for a team repository.

**Solution**:
```bash
# List all files for the specific repository
varte list -o wrestle-R -r BitNBuild-25_TeamCotton

# Output will show:
# 📋 Environment Files for wrestle-R/BitNBuild-25_TeamCotton:
#
# 📁 wrestle-R/BitNBuild-25_TeamCotton
#    └─ .env.01/12/2025T14:32 (gavin100305) (by gavin100305) - 12/1/2025, 2:32:50 PM
#    └─ .env.production (by wrestle-R) - 12/1/2025, 3:45:00 PM
```

---

## Security Considerations

### Access Control
- **Authentication**: All operations require a valid GitHub OAuth token
- **Push Permission**: Only users with push access to a repository can upload env files
- **Pull Permission**: Any authenticated user can pull env files (no permission check)
  - This is intentional - if someone has the repo name, they're likely a collaborator
  - Security is enforced through encryption, not access control

### Encryption
- All env file content is encrypted using AES-256-GCM before being sent to the server
- The encryption key is stored as a Cloudflare Worker secret
- Only the CLI can decrypt the content (it fetches the encryption key from `/api/encryption-key`)
- Even if someone gains database access, they cannot read the env files without the encryption key

### Privacy
- User IDs and usernames are stored in plaintext to enable attribution
- Repository names are stored in plaintext to enable querying
- Directory paths are stored in plaintext for organization
- **Only the content is encrypted**

---

## Database Indexes

For optimal query performance, create the following Firestore indexes:

1. **Pull queries**: Composite index on `(repoFullName, directory)`
2. **List with filter**: Single-field index on `repoFullName`
3. **List without filter**: Single-field index on `userId`

These indexes are typically created automatically when queries are first run, but can be pre-created for better performance.

---

## Troubleshooting

### "No environment files found"

**When running `varte pull`**:
- Check that the repository name is correct
- Check that the directory path matches exactly (case-sensitive)
- Verify that someone has actually pushed a file to that repo/directory
- Try running `varte list -o OWNER -r REPO` to see what exists

**When running `varte list`**:
- If no repo specified: You haven't pushed any files yet
- If repo specified: No files exist for that repository

### "Repository not found" or "No push access"

**When running `varte push`**:
- Your GitHub token doesn't have access to the repository
- The repository name is incorrect
- You don't have write permissions (must be owner or collaborator with push access)

### Files from collaborators not showing

**Check**:
1. Run `varte list -o OWNER -r REPO` to verify files exist
2. Ensure you're using the exact same `repoFullName` and `directory` as when the file was pushed
3. Verify the backend has been updated with the new query logic (not filtering by userId)

---

## Summary

| Operation | Authentication | Filters Applied | Can See Others' Files? |
|-----------|---------------|-----------------|----------------------|
| **Push**  | Required + Repo Access | None (INSERT) | N/A |
| **Pull**  | Required | `repoFullName`, `directory` | ✅ Yes |
| **List (no filter)** | Required | `userId` | ❌ No - only yours |
| **List (with repo)** | Required | `repoFullName` | ✅ Yes |

The key insight: **Pull and filtered List operations are designed for collaboration** - they show files from all users who have contributed to a repository.
