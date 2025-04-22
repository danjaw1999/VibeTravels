# Manual Test Plan for Refactored Forms

## Setup

1. Start the development server: `npm run dev`
2. Open the browser at http://localhost:4321

## TravelNoteForm Tests

### Test 1: Form Rendering

- Navigate to page with TravelNoteForm
- Verify all form elements are displayed properly
- Check that validation states are initially not shown

### Test 2: Form Validation

- Try to submit an empty form
- Verify appropriate validation errors are displayed
- Enter only a name, but no description
- Verify validation error for description field

### Test 3: Successful Submission

- Enter valid data in all required fields:
  - Name: "Test Destination"
  - Description: "This is a test description"
  - Keep "Make this note public" checked
- Submit the form
- Verify you are redirected to the correct page

### Test 4: Error Handling

- If possible, trigger an error (e.g. by disconnecting internet connection)
- Submit the form
- Verify error message is displayed

## RegisterForm Tests

### Test 1: Form Rendering

- Navigate to the registration page
- Verify all form elements are displayed properly
- Check that password strength indicator is visible
- Verify all password requirement indicators are shown

### Test 2: Form Validation

- Try to enter an invalid email
- Verify email validation error is displayed
- Enter a weak password
- Verify password strength indicator updates appropriately
- Verify password requirement indicators update based on entered password
- Try to submit with invalid data
- Verify form submission is blocked

### Test 3: Password Strength Indicator

- Enter a password that meets 0/5 requirements
- Verify indicator is red
- Enter a password that meets 2/5 requirements
- Verify indicator is orange
- Enter a password that meets 3/5 requirements
- Verify indicator is yellow
- Enter a password that meets all requirements
- Verify indicator is green

### Test 4: Successful Submission

- Enter valid data in all required fields:
  - Email: "test@example.com"
  - Password: "Test1234!"
  - Optional profile description
- Submit the form
- Verify you are redirected to the correct page

## Results:

- TravelNoteForm: ✅ Pass / ❌ Fail
- RegisterForm: ✅ Pass / ❌ Fail

## Notes:

- Add any additional observations or issues discovered during testing
