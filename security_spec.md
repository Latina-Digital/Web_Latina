# Industrial Latina ERP - Security Specification (`security_spec.md`)

## 1. Data Invariants & Relational Sources of Truth

1. **Global Default-Deny Safety Net**: Every unmatched path is strictly rejected (`allow read, write: if false;`).
2. **Verified Identity & Anti-Spoofing**: All standard write operations require `request.auth != null && request.auth.token.email_verified == true`. Bootstrapped admin access (`industriallatina.digital@gmail.com` or `/admins/{uid}`) requires `email_verified == true`.
3. **Strict Schema & Key Allowlisting (`hasAll` + `hasOnly`)**: Every entity (`Order`, `InventoryItem`, `Invoice`, `Shipment`, `NotificationLog`, `UserProfilePublic`, `UserProfilePrivate`) enforces exact required and allowed keys on creation and `affectedKeys().hasOnly(...)` on action-based updates.
4. **Terminal State Locking**:
   - `Order`: Once `existing().status in ['entregado', 'cancelado']`, non-admin updates are blocked.
   - `Invoice`: Once `existing().status in ['pagada', 'anulada']`, non-admin updates are blocked.
   - `Shipment`: Once `existing().status == 'entregado'`, non-admin updates are blocked.
5. **PII Isolation (Split Collection Strategy)**:
   - Public operator metadata resides in `/users/{userId}` (`UserProfilePublic`). Users cannot self-assign admin privileges (`role in ['operador', 'logistica', 'finanzas', 'cliente']`) or modify their `role` on update unless `isAdmin()`.
   - PII (`email`, `phone`) is strictly isolated in `/users/{userId}/private/{docId}` (`UserProfilePrivate`), where `get`, `list`, `create`, `update`, and `delete` are restricted to `isOwner(userId) || isAdmin()`, with `get(/databases/$(database)/documents/users/$(userId)).data.ownerId == request.auth.uid` as the Master Gate for sub-collection sync.
6. **Temporal & Ownership Immutability**:
   - On `create`: `incoming().ownerId == request.auth.uid && incoming().createdAt == request.time`.
   - On `update`: `incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`.
7. **Secure List Queries (Query Enforcer)**:
   - No blanket `allow list: if isSignedIn();`. Every `allow list` rule restricts `resource.data.ownerId == request.auth.uid || isAdmin()`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Shadow Field Injection on Order)**: Adding `"isVerifiedAdmin": true` to `/orders/ord_01` creation -> Rejected by `data.keys().hasOnly(...)`.
2. **Payload 2 (Identity Spoofing on Order Creation)**: Setting `ownerId: "victim_uid"` while authenticated as `"attacker_uid"` -> Rejected by `data.ownerId == request.auth.uid`.
3. **Payload 3 (Unverified Email Admin Spoof)**: Request with `request.auth.token.email == "industriallatina.digital@gmail.com"` but `email_verified == false` -> Rejected by `isVerifiedUser()`.
4. **Payload 4 (Terminal State Mutation on Delivered Order)**: Updating `/orders/ord_01` when `existing().status == "entregado"` as non-admin -> Rejected by terminal state lock.
5. **Payload 5 (Value Poisoning on Whitelisted Update Key)**: Updating `/orders/ord_01` `status` to a 2MB string or invalid enum `"hacked"` -> Rejected because `isValidOrder(incoming())` wraps the entire `allow update` block.
6. **Payload 6 (Self-Assigned Admin Role Escalation)**: Creating `/users/attacker_uid` with `role: "admin"` -> Rejected by enum constraint `['operador', 'logistica', 'finanzas', 'cliente']`.
7. **Payload 7 (Role Mutation on User Update)**: Updating `/users/attacker_uid` with `role: "finanzas"` -> Rejected because `affectedKeys().hasOnly(['displayName', 'department', 'twoFactorEnabled', 'e2eeKeyFingerprint', 'updatedAt'])` excludes `role`.
8. **Payload 8 (Cross-User PII Leak)**: Authenticated user `"user_b"` attempting `get` on `/users/user_a/private/info` -> Rejected by `isOwner(userId) || isAdmin()`.
9. **Payload 9 (Orphaned Subcollection Write)**: Writing to `/users/user_a/private/info` when parent `/users/user_a` does not exist -> Rejected by Master Gate `get(/databases/$(database)/documents/users/$(userId)).data.ownerId == request.auth.uid`.
10. **Payload 10 (Client Timestamp Forgery)**: Creating `/invoices/inv_01` with past or future `createdAt` timestamp != `request.time` -> Rejected by `incoming().createdAt == request.time`.
11. **Payload 11 (ID Poisoning / Denial of Wallet)**: Creating `/inventory/{1500_char_id}` -> Rejected by `isValidId(itemId)` (`id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).
12. **Payload 12 (Unauthorized Blanket List Scraping)**: Running `list` on `/invoices` without filtering by `ownerId == request.auth.uid` -> Rejected by `resource.data.ownerId == request.auth.uid || isAdmin()`.

---

## 3. Red Team Audit & Verification

- Every collection defined in `firebase-blueprint.json` (`/orders/{orderId}`, `/inventory/{itemId}`, `/invoices/{invoiceId}`, `/shipments/{shipmentId}`, `/notifications/{notificationId}`, `/users/{userId}`, `/users/{userId}/private/{docId}`) has a dedicated hardened match block.
- Automated verification suite located in `src/security/firestore.rules.test.ts` validates all 12 Dirty Dozen payloads and confirms `PERMISSION_DENIED` on every attack vector.
