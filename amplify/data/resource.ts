import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

/**
 * Identity Compound data model. Every model is owner-scoped: Cognito's user id
 * is stamped on each record and only that user can read or write it — the
 * DynamoDB equivalent of the previous Postgres row-level security.
 *
 * Field names stay snake_case to match the app's existing types.
 */
const schema = a.schema({
  Profile: a
    .model({
      display_name: a.string(),
      week_starts_on: a.integer().default(1), // 1 = Monday, 0 = Sunday
      reminders_enabled: a.boolean().default(false),
      morning_time: a.string().default('08:00'),
      evening_time: a.string().default('21:30'),
      inversion_nudges: a.boolean().default(true),
    })
    .authorization((allow) => [allow.owner()]),

  Domain: a
    .model({
      name: a.string().required(),
      emoji: a.string().required(),
      color: a.string().required(),
      identity_statement: a.string(),
      vision: a.string(),
      anti_vision: a.string(),
      sort_order: a.integer().default(0),
      archived: a.boolean().default(false),
    })
    .authorization((allow) => [allow.owner()]),

  LifeGoal: a
    .model({
      domain_id: a.id(),
      title: a.string().required(),
      done: a.boolean().default(false),
      sort_order: a.integer().default(0),
    })
    .authorization((allow) => [allow.owner()]),

  /**
   * One thing you will do — or refuse to do — on one specific day.
   * Set fresh each day; checking it off is a vote for the identity.
   */
  DailyItem: a
    .model({
      date: a.date().required(), // 'YYYY-MM-DD'
      title: a.string().required(),
      kind: a.enum(['do', 'dont']),
      domain_id: a.id(),
      done: a.boolean().default(false),
      sort_order: a.integer().default(0),
    })
    .authorization((allow) => [allow.owner()]),

  /**
   * One completed urge flow (Today → "Right now"): the moment a craving,
   * irritation, worry, boredom or bedtime resistance was met with a pause
   * instead of a reaction. Catching it is the win — so it gets recorded.
   */
  UrgeEvent: a
    .model({
      date: a.date().required(), // 'YYYY-MM-DD'
      urge_id: a.string().required(), // matches lib/urges.ts ids
      note: a.string(), // what the user named, if anything
      created_at: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  DailyEntry: a
    .model({
      date: a.date().required(),
      committed_at: a.datetime(),
      reflection: a.string(),
      alignment: a.integer(), // 1..5
    })
    .authorization((allow) => [allow.owner()]),

  WeeklyReflection: a
    .model({
      week_start: a.date().required(), // 'YYYY-MM-DD'
      ratings: a.json(), // domain id -> 1..5
      evidence: a.string(),
      wins: a.string(),
      lessons: a.string(),
      change_one: a.string(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
