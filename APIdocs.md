# Eventify — Backend API Reference

Base URL: `http://localhost:5000/api`

All protected routes require:
```
Authorization: Bearer <token>
```

---

## Auth Routes `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register a new user (IIT BHU emails only) |
| POST | `/login` | ❌ | Login (works for both users and admin) |
| GET | `/me` | ✅ | Get current user profile |
| POST | `/logout` | ✅ | Logout (clears cookie) |
| PUT | `/update-profile` | ✅ | Update name/designation/department |
| PUT | `/change-password` | ✅ | Change password |

### POST /register
```json
{
  "name": "Arjun Sharma",
  "email": "arjun@iitbhu.ac.in",
  "password": "mypassword",
  "designation": "President, Robotics Club",
  "department": "Mechanical Engineering"
}
```

### POST /login
```json
{ "email": "arjun@iitbhu.ac.in", "password": "mypassword" }
```
Admin login: `{ "email": "admin@iitbhu.ac.in", "password": "ShuklaAdmin" }`

---

## Event Routes `/api/events`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ❌ | List all active events |
| GET | `/:id` | ❌ | Get single event with comments |
| POST | `/` | ✅ | Create a new event |
| PUT | `/:id` | ✅ | Update event (owner or admin) |
| DELETE | `/:id` | ✅ | Soft-delete event (owner or admin) |
| POST | `/:id/comments` | ✅ | Add a comment |
| PUT | `/:id/comments/:commentId` | ✅ | Edit your comment |
| DELETE | `/:id/comments/:commentId` | ✅ | Delete comment (owner or admin) |

### GET /events query params
- `?page=1&limit=10` — pagination
- `?category=Technical` — filter by category
- `?club=Robotics` — filter by club name (partial match)
- `?search=workshop` — search title/description/club/tags
- `?upcoming=true` — only future events

### POST /events body
```json
{
  "title": "Robotics Workshop 2025",
  "description": "Hands-on workshop on Arduino and ROS...",
  "club": "Robotics Club IIT BHU",
  "location": "Electronics Lab, IT Building",
  "eventDate": "2025-09-15T00:00:00.000Z",
  "eventTime": "9:00 AM – 5:00 PM",
  "requirements": "Laptop required. Registration fee: ₹200.",
  "category": "Technical",
  "registrationLink": "https://example.com/register",
  "maxParticipants": 30,
  "tags": ["robotics", "arduino"]
}
```

Categories: `Technical | Cultural | Sports | Academic | Workshop | Seminar | Social | Other`

---

## Admin Routes `/api/admin` (admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Overview stats + recent activity |
| GET | `/stats` | Detailed charts data |
| GET | `/users` | List all users |
| GET | `/users/:id` | User detail + their events |
| PATCH | `/users/:id/toggle` | Activate/deactivate user |
| DELETE | `/users/:id` | Permanently delete user |
| GET | `/events` | All events (including deleted) |
| PUT | `/events/:id` | Edit any event |
| DELETE | `/events/:id` | Soft-delete any event |
| PATCH | `/events/:id/restore` | Restore deleted event |

---

## Health Check

```
GET /health
```

---

## Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```

## Success Response Format
```json
{
  "success": true,
  "message": "...",
  "token": "...",
  "user": { ... },
  "event": { ... }
}
```