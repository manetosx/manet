# Testing Phase 2 - Complete Guide

## Prerequisites ✅

**Backend:**
- [x] Backend server running on http://localhost:3000
- [x] MongoDB service running
- [x] All API endpoints functional

**Mobile:**
- [ ] Metro bundler started
- [ ] iOS Simulator OR Android Emulator running
- [ ] Mobile app installed

---

## Test Plan

### Test 1: Backend Connectivity ✅

**Verify backend is accessible:**
```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok","message":"Server is running"}
```

**Status:** ✅ PASSED

---

### Test 2: Mobile App Launch

**Start Metro Bundler:**
```bash
cd mobile
npm start
```

**Launch on iOS (if on macOS):**
```bash
npm run ios
```

**Launch on Android:**
```bash
npm run android
```

**Expected Result:**
- App opens without crashes
- Login screen appears
- No red error screens
- No yellow warnings (acceptable if minor)

**What to Check:**
- [ ] App icon loads
- [ ] Login screen displays correctly
- [ ] "Welcome to maNet" title visible
- [ ] Email and Password inputs visible
- [ ] "Sign In" button visible
- [ ] "Continue with Google" button visible
- [ ] "Don't have an account? Sign Up" link visible

---

### Test 3: Registration Flow

**Steps:**
1. On Login screen, tap "Sign Up"
2. Register screen should appear
3. Fill in the form:
   - Username: `testuser2`
   - Email: `testuser2@manet.com`
   - Password: `test1234`
   - Confirm Password: `test1234`
4. Tap "Sign Up" button

**Expected Result:**
- Loading spinner appears briefly
- Registration succeeds
- User is logged in automatically
- Home screen appears with "Welcome to maNet! Hello, testuser2!"

**What to Check:**
- [ ] Loading state shows (spinner on button)
- [ ] No error alerts appear
- [ ] Home screen loads
- [ ] Username displays correctly
- [ ] "Sign Out" button visible

**If Registration Fails:**
- Check if user already exists (try different email)
- Check backend logs for errors
- Check Metro bundler for errors

---

### Test 4: Navigation to Register Screen

**Steps:**
1. On Login screen, tap "Sign Up" link

**Expected Result:**
- Register screen slides in from right
- All form fields visible
- Can navigate back with gesture or back button

**What to Check:**
- [ ] Screen transition is smooth
- [ ] Register form loads completely
- [ ] Back navigation works (swipe or button)

---

### Test 5: Input Validation (Registration)

**Test 5a: Empty Fields**
1. On Register screen, leave all fields empty
2. Tap "Sign Up"

**Expected:** Alert "Please fill in all fields"

**Test 5b: Short Username**
1. Enter username: `ab` (less than 3 chars)
2. Fill other fields correctly
3. Tap "Sign Up"

**Expected:** Alert "Username must be at least 3 characters"

**Test 5c: Short Password**
1. Enter valid username
2. Enter password: `12345` (less than 6 chars)
3. Confirm password: `12345`
4. Tap "Sign Up"

**Expected:** Alert "Password must be at least 6 characters"

**Test 5d: Password Mismatch**
1. Enter valid username and email
2. Password: `password123`
3. Confirm Password: `password456`
4. Tap "Sign Up"

**Expected:** Alert "Passwords do not match"

**What to Check:**
- [ ] All validation alerts appear correctly
- [ ] No crashes on validation
- [ ] Fields remain filled after validation error

---

### Test 6: Login Flow

**Steps:**
1. If on Home screen, tap "Sign Out"
2. Login screen should appear
3. Enter credentials:
   - Email: `testuser2@manet.com`
   - Password: `test1234`
4. Tap "Sign In"

**Expected Result:**
- Loading spinner appears
- Login succeeds
- Home screen appears
- Username displays: "Hello, testuser2!"

**What to Check:**
- [ ] Loading state shows
- [ ] Login succeeds
- [ ] Navigates to Home
- [ ] User data is correct

---

### Test 7: Login Validation

**Test 7a: Wrong Password**
1. On Login screen, enter:
   - Email: `testuser2@manet.com`
   - Password: `wrongpassword`
2. Tap "Sign In"

**Expected:** Alert "Login Failed - Invalid credentials"

**Test 7b: Non-existent User**
1. Enter:
   - Email: `nonexistent@manet.com`
   - Password: `test1234`
2. Tap "Sign In"

**Expected:** Alert "Login Failed - Invalid credentials"

**Test 7c: Empty Fields**
1. Leave fields empty
2. Tap "Sign In"

**Expected:** Alert "Please fill in all fields"

**What to Check:**
- [ ] Error messages are user-friendly
- [ ] No app crashes on wrong credentials
- [ ] Can try again after error

---

### Test 8: Persistent Login (Auto-Login)

**Steps:**
1. Login successfully (if not already logged in)
2. Verify you're on Home screen
3. **Close the app completely** (don't just background it)
   - iOS: Swipe up from bottom, swipe app away
   - Android: Recent apps, swipe app away
4. Reopen the app from home screen

**Expected Result:**
- Brief loading screen appears
- App automatically logs in
- Home screen appears WITHOUT showing login screen
- Username still displays correctly

**What to Check:**
- [ ] No login screen shown
- [ ] Goes directly to Home
- [ ] User data persists
- [ ] Takes less than 2 seconds

**This tests:**
- AsyncStorage is working
- Token is saved correctly
- AuthContext checks auth on mount
- Auto-login logic works

---

### Test 9: Logout Flow

**Steps:**
1. On Home screen, tap "Sign Out" button

**Expected Result:**
- User is logged out
- Login screen appears
- No errors

**What to Check:**
- [ ] Navigates to Login screen
- [ ] No crashes
- [ ] Cannot go back to Home with back button

---

### Test 10: Logout Persistence

**Steps:**
1. Logout (you should be on Login screen)
2. Close app completely
3. Reopen app

**Expected Result:**
- Login screen appears (not Home)
- Must login again to access app

**What to Check:**
- [ ] Stays logged out
- [ ] Token is cleared
- [ ] Must login again

**This tests:**
- Logout clears AsyncStorage
- Auth state resets correctly

---

### Test 11: UI/UX Check

**Things to Verify:**

**Login Screen:**
- [ ] Title: "Welcome to maNet"
- [ ] Subtitle: "Sign in to continue"
- [ ] Inputs have rounded corners
- [ ] Blue button (#007AFF)
- [ ] Google button is white with border
- [ ] Sign Up link is blue and tappable

**Register Screen:**
- [ ] Title: "Create Account"
- [ ] Subtitle: "Sign up to get started"
- [ ] 4 input fields visible
- [ ] Confirm password field is secure (dots)
- [ ] Sign In link works

**Home Screen:**
- [ ] Welcome message displays
- [ ] Username shows correctly
- [ ] "Phase 2 in progress" info box
- [ ] Red Sign Out button
- [ ] Everything centered nicely

**General:**
- [ ] Keyboard appears when tapping inputs
- [ ] Can dismiss keyboard
- [ ] Keyboard doesn't cover inputs (KeyboardAvoidingView works)
- [ ] Scroll works if screen is too tall
- [ ] Touch targets are large enough
- [ ] Text is readable

---

### Test 12: API Connection

**Check Network Tab (if possible):**
1. Open React Native debugger OR use console
2. Register a new user
3. Look for network request

**Expected:**
- POST to `http://10.0.2.2:3000/api/auth/register` (Android)
- OR POST to `http://localhost:3000/api/auth/register` (iOS)
- Response includes token and user object
- Status: 201 Created

**Check Backend Logs:**
```bash
# Backend should log:
# POST /api/auth/register 201
# POST /api/auth/login 200
```

---

### Test 13: Loading States

**Check All Loading Indicators:**
1. During Registration:
   - [ ] Button shows spinner
   - [ ] Button is disabled
   - [ ] Inputs are disabled

2. During Login:
   - [ ] Button shows spinner
   - [ ] Button is disabled
   - [ ] Inputs are disabled

3. On App Start:
   - [ ] Loading indicator shows while checking auth
   - [ ] Disappears when auth check complete

---

### Test 14: Error Handling

**Test Network Error:**
1. Stop backend server:
   ```bash
   # Stop the backend
   ```
2. Try to login or register

**Expected:**
- Alert shows: "Network error. Please check your connection."
- App doesn't crash
- Can try again when backend is back

**Test Server Error:**
1. Make sure backend is running
2. Try to register with an email that already exists

**Expected:**
- Alert shows error message from server
- App doesn't crash

---

## Phase 2 Test Results

**Date:** January 13, 2026
**Tester:** Christos
**Platform:** [X] Android  [ ] iOS

### Summary
- Total Tests: 14
- Passed: 14
- Failed: 0
- Skipped: 0

### Test Results

1. Backend Connectivity: [X] PASS
2. Mobile App Launch: [X] PASS
3. Registration Flow: [X] PASS (user: christos)
4. Navigation: [X] PASS
5. Registration Validation: [X] PASS
6. Login Flow: [X] PASS
7. Login Validation: [X] PASS (all error cases tested)
8. Persistent Login: [X] PASS
9. Logout Flow: [X] PASS
10. Logout Persistence: [X] PASS
11. UI/UX: [X] PASS (described as "polished and professional")
12. API Connection: [X] PASS
13. Loading States: [X] PASS
14. Error Handling: [X] PASS (network error handling verified)

### Bonus Achievement
- Wi-Fi Connection Setup: [X] PASS
  - Successfully connected phone wirelessly to Metro (192.168.1.243:8081)
  - Backend accessible over network (192.168.1.243:3000)
  - App works without USB cable connection

### Issues Found
None - all tests passed successfully!

### Notes
- App performance is smooth with no lag
- UI is clean and professional looking
- All validation messages are user-friendly
- Auto-login feature works perfectly
- Network error handling is stable (app doesn't crash)
- Tested on physical Android device over Wi-Fi
- All loading indicators appear and function correctly

---

## Common Issues & Solutions

### Issue: Metro Bundler Won't Start
**Solution:**
```bash
cd mobile
npx react-native start --reset-cache
```

### Issue: "Unable to resolve module"
**Solution:**
```bash
cd mobile
rm -rf node_modules
npm install
cd ios && pod install && cd ..
```

### Issue: Android Build Fails
**Solution:**
```bash
cd mobile/android
./gradlew clean
cd ../..
npm run android
```

### Issue: iOS Build Fails
**Solution:**
```bash
cd mobile/ios
pod install
cd ../..
npm run ios
```

### Issue: "Network request failed"
**Check:**
1. Backend is running
2. For Android: Using `10.0.2.2` not `localhost`
3. For iOS: Backend is on `localhost:3000`
4. Firewall isn't blocking connections

### Issue: "Authentication error" on Socket.IO
**Note:** This is expected! Socket.IO will try to connect but needs implementation in Phase 3.

---

## Next Steps After Testing

### If All Tests Pass ✅
- Phase 2 is confirmed working!
- Ready to proceed to Phase 3
- Can make LinkedIn post about completion

### If Some Tests Fail ❌
- Document the failures
- Fix bugs found
- Re-test failed scenarios
- Update code as needed

---

## Ready to Test!

**Start here:**
```bash
# Terminal 1: Backend (should already be running)
cd backend
npm run dev

# Terminal 2: Metro Bundler
cd mobile
npm start

# Terminal 3: Run App
cd mobile
npm run android  # or npm run ios
```

**Then follow the test plan above step by step!**

Good luck! 🚀
