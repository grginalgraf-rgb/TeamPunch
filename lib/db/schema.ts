import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

const tz = { withTimezone: true } as const

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  role: text('role', { enum: ['EMPLOYEE', 'ADMIN'] })
    .notNull()
    .default('EMPLOYEE'),
  createdAt: timestamp('createdAt', tz).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', tz).notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', tz).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt', tz).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', tz).notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', tz),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', tz),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt', tz).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', tz).notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', tz).notNull(),
  createdAt: timestamp('createdAt', tz).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', tz).notNull().defaultNow(),
})

export const attendance = pgTable('attendance', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId').notNull(),
  clockIn: timestamp('clockIn', tz).notNull().defaultNow(),
  clockOut: timestamp('clockOut', tz),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  status: text('status', { enum: ['ACTIVE', 'BREAK', 'COMPLETED'] })
    .notNull()
    .default('ACTIVE'),
  isLate: boolean('isLate').notNull().default(false),
  outsideGeofence: boolean('outsideGeofence').notNull().default(false),
  flagged: boolean('flagged').notNull().default(false),
  flagReason: text('flagReason'),
  createdAt: timestamp('createdAt', tz).notNull().defaultNow(),
})

export const attendanceBreak = pgTable('attendance_break', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  attendanceId: text('attendanceId').notNull(),
  startTime: timestamp('startTime', tz).notNull().defaultNow(),
  endTime: timestamp('endTime', tz),
})

export const orgSettings = pgTable('org_settings', {
  id: integer('id').primaryKey().default(1),
  timezone: text('timezone').notNull().default('UTC'),
  workStart: text('workStart').notNull().default('09:00'),
  graceMinutes: integer('graceMinutes').notNull().default(5),
  geofenceLat: doublePrecision('geofenceLat'),
  geofenceLng: doublePrecision('geofenceLng'),
  geofenceRadiusM: integer('geofenceRadiusM').notNull().default(200),
})

export type AttendanceRow = typeof attendance.$inferSelect
export type BreakRow = typeof attendanceBreak.$inferSelect
export type OrgSettingsRow = typeof orgSettings.$inferSelect
