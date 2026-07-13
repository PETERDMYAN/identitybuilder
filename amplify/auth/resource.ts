import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Sign in with Apple via the Cognito user pool (OAuth flow). Cognito mints the
 * Apple client secret from the team's SIWA key. Email/password stays enabled
 * at the pool level but the app UI only offers Apple.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      signInWithApple: {
        clientId: secret('SIWA_CLIENT_ID'), // Apple Services ID
        keyId: secret('SIWA_KEY_ID'),
        privateKey: secret('SIWA_PRIVATE_KEY'),
        teamId: secret('SIWA_TEAM_ID'),
        // The pool requires the email attribute on every federated login, so
        // Apple must be asked for it — without this scope Apple never includes
        // the email claim and Cognito rejects the sign-in ("attribute emails
        // is required").
        scopes: ['email', 'name'],
      },
      callbackUrls: ['identitybuilder://'],
      logoutUrls: ['identitybuilder://'],
    },
  },
});
