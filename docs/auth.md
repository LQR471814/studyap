## authentication

1. login/signup screen: a single email input box, inputting an email will prompt you to enter a verification code sent to the email given.
2. pending verification row is inserted (verification code + token + userEmail)
3. when verification code is entered, search for pending verification row, if found return token and insert active token row (token + userEmail + expiresAt), if user with userEmail not found, insert new user.

### weaknesses

1. easily DDOS-able, someone could keep sending a bunch of emails and drive us over our usage limits in email. let's hope this doesn't happen.

