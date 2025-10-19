# 🎨 Invitation System - Visual User Guide

## Manager Workflow

### Step 1: Access Project Settings

```
Settings → Projects
```

You'll see all your projects listed with a new button:

```
┌─────────────────────────────────────────────┐
│ Project Name                    [Mời thành viên] │
│                                                │
│ Installation Snippet                           │
│ <script ...>                                   │
└─────────────────────────────────────────────┘
```

### Step 2: Click "Mời thành viên"

Navigate to the invitation page for that specific project.

### Step 3: Send Invitation

```
┌──────────────────────────────────────────────┐
│  Gửi lời mời                                  │
│                                               │
│  Địa chỉ email:                               │
│  [agent@example.com                     ]     │
│                                               │
│  Vai trò:                                     │
│  [Agent (Nhân viên hỗ trợ)             ▼]    │
│                                               │
│  [📧 Gửi lời mời]                            │
└──────────────────────────────────────────────┘
```

### Step 4: View & Manage Invitations

```
┌──────────────────────────────────────────────┐
│  Danh sách lời mời                            │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ agent@example.com           [Agent]    │  │
│  │ ⏰ Đang chờ • Hết hạn: 26/10/2025    🗑️ │  │
│  └────────────────────────────────────────┘  │
│                                               │
│  ┌────────────────────────────────────────┐  │
│  │ another@example.com        [Manager]   │  │
│  │ ✅ Đã chấp nhận • Hết hạn: 25/10/2025   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## Invitee Workflow

### Step 1: Receive Email

```
┌─────────────────────────────────────────────┐
│ From: Social Commerce <noreply@...>         │
│ Subject: Lời mời tham gia dự án "My Project"│
│                                              │
│ Xin chào,                                    │
│                                              │
│ Bạn đã được mời tham gia dự án My Project   │
│ với vai trò Agent.                           │
│                                              │
│ ┌────────────────────────────────┐          │
│ │   🎯 Chấp nhận lời mời          │          │
│ └────────────────────────────────┘          │
│                                              │
│ Lời mời này sẽ hết hạn sau 7 ngày.          │
└─────────────────────────────────────────────┘
```

### Step 2: Click Link → Auto Accept

```
┌─────────────────────────────────────────────┐
│                                              │
│              🔄 Đang xử lý...                │
│                                              │
│         Vui lòng đợi trong giây lát          │
│                                              │
└─────────────────────────────────────────────┘
```

### Step 3: Success!

```
┌─────────────────────────────────────────────┐
│                                              │
│              ✅ Chấp nhận thành công!         │
│                                              │
│    Bạn đã tham gia dự án. Đang chuyển hướng...│
│                                              │
└─────────────────────────────────────────────┘
```

### Step 4: Redirected to Inbox

User is now a member and can access the project!

---

## Status Indicators

### Pending (Đang chờ)

```
⏰ Đang chờ
Yellow clock icon
Can be cancelled by manager
```

### Accepted (Đã chấp nhận)

```
✅ Đã chấp nhận
Green checkmark icon
User is now a project member
Cannot be cancelled
```

### Expired (Đã hết hạn)

```
❌ Đã hết hạn
Red X icon
Invitation no longer valid
Need to send new invitation
```

---

## Error States

### Token Invalid

```
┌─────────────────────────────────────────────┐
│              ❌ Chấp nhận thất bại            │
│                                              │
│  Token không hợp lệ. Vui lòng kiểm tra      │
│  lại liên kết.                               │
│                                              │
│  [🏠 Về trang chủ]  [🔄 Thử lại]          │
└─────────────────────────────────────────────┘
```

### Already Member

```
┌─────────────────────────────────────────────┐
│              ❌ Chấp nhận thất bại            │
│                                              │
│  You are already a member of this project.   │
│                                              │
│  [🏠 Về trang chủ]  [🔄 Thử lại]          │
└─────────────────────────────────────────────┘
```

### Expired Token

```
┌─────────────────────────────────────────────┐
│              ❌ Chấp nhận thất bại            │
│                                              │
│  This invitation has expired.                │
│                                              │
│  [🏠 Về trang chủ]  [🔄 Thử lại]          │
└─────────────────────────────────────────────┘
```

---

## Toast Notifications

### Success - Invitation Sent

```
┌────────────────────────────┐
│ ✅ Thành công              │
│ Lời mời đã được gửi thành công! │
└────────────────────────────┘
```

### Success - Invitation Cancelled

```
┌────────────────────────────┐
│ ✅ Thành công              │
│ Đã hủy lời mời.            │
└────────────────────────────┘
```

### Error - Already Exists

```
┌────────────────────────────┐
│ ❌ Lỗi                     │
│ A pending invitation already│
│ exists for this email.      │
└────────────────────────────┘
```

### Error - Rate Limited

```
┌────────────────────────────┐
│ ❌ Lỗi                     │
│ Too many requests. Please   │
│ try again later.            │
└────────────────────────────┘
```

---

## Role Selector Options

```
┌─────────────────────────────────┐
│ Vai trò:                        │
│ ┌─────────────────────────────┐ │
│ │ Agent (Nhân viên hỗ trợ)  ▼│ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

When clicked:
┌─────────────────────────────────┐
│ Agent (Nhân viên hỗ trợ)     ← │
│ Manager (Quản lý)              │
└─────────────────────────────────┘
```

---

## Navigation Flow

```
Settings
    │
    ├─ Projects
    │    │
    │    └─ [Mời thành viên] → /projects/:id/invite
    │                            │
    │                            ├─ Send Invitation Form
    │                            └─ Invitations List
    │
    └─ Profile / Security

Email Link → /accept-invitation?token=xxx
                │
                ├─ Success → /inbox (auto redirect)
                └─ Error → Stay on page with retry option
```

---

## Icons Used

| Icon | Meaning           | Context                  |
| ---- | ----------------- | ------------------------ |
| 📧   | Email/Send        | Send invitation button   |
| 🗑️   | Delete            | Cancel invitation button |
| ⏰   | Clock/Pending     | Pending status           |
| ✅   | Checkmark/Success | Accepted status          |
| ❌   | X/Error           | Expired or error status  |
| 👤   | User              | User-related actions     |
| ➕   | Plus              | Add member action        |
| ⬅️   | Back arrow        | Return to previous page  |
| 🔄   | Refresh           | Retry action             |
| 🏠   | Home              | Return to home           |

---

## Color Coding

- **Primary Blue**: Action buttons, links
- **Yellow**: Pending status, warnings
- **Green**: Success states, accepted invitations
- **Red**: Errors, expired invitations, delete actions
- **Gray**: Disabled states, secondary text

---

## Responsive Behavior

### Desktop (>768px)

- Full layout with sidebar
- Wide form inputs
- Multi-column invitation list

### Mobile (<768px)

- Stacked layout
- Full-width buttons
- Single-column invitation list
- Touch-friendly tap targets

---

## Accessibility Features

✅ Keyboard navigation support
✅ ARIA labels for screen readers
✅ High contrast colors
✅ Focus indicators
✅ Error messages clearly announced
✅ Loading states communicated

---

## Performance

- ⚡ Real-time updates with React Query
- ⚡ Optimistic UI updates
- ⚡ Automatic cache invalidation
- ⚡ Debounced form inputs (if needed)
- ⚡ Lazy loading of invitation lists

---

**Last Updated:** October 19, 2025
**Version:** 1.0
