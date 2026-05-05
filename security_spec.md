# CricExpert Pro Security Specification

## 1. Data Invariants
- `Match`: Must have `id` (alphanumeric, max 128 chars), `title` (max 500 chars), `status` (enum: LIVE, UPCOMING, FINISHED), `date` (ISO string).
- `Player`: Must have `name` (max 200 chars), `role` (enum: batsman, bowler, allrounder, wicketkeeper), `credits` (positive number).
- `FantasyTeam`: Must reference a valid `matchId`. Player list size must be 11. Credit sum <= 100. Max 7 players from one team.

## 2. The Dirty Dozen Payloads (Target: DENY)
1. **Payload Size Attack**: Create match with 1MB `title`.
2. **ID Poisoning**: Create player with ID `../../../etc/passwd`.
3. **Enum Break**: Set player role to `ninja`.
4. **Logic Bypass**: Create fantasy team with 15 players.
5. **Credit Overdraw**: Create fantasy team with 150 credits.
6. **Identity Spoofing**: List teams while pretending to be an admin without verified email.
7. **XSS Injection**: Set venue to `<script>alert('xss')</script>`.
8. **Immutability Breach**: Update `matchId` in an existing team.
9. **Temporal Warp**: Set `createdAt` to 10 years in the future.
10. **Unauthorized Write**: Post a new match as an unauthenticated user.
11. **System Field Tampering**: Manually update `lastUpdated` without using server time.
12. **Batch Exhaustion**: Attempt to delete the entire `matches` collection in one request.

## 3. Test Runner (Planned)
- Use `firebase-rules-generator` (internal process) to verify.
