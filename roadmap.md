# Account system
- [x] Add email signup/login and confirmation handling; signup confirmation state verified.
- [x] Add private editable profiles and sign out; save/reload and protected access verified.
- [x] Add password recovery; invalid recovery links rejected. Email delivery and completed email-link recovery remain unverified.
- [x] Show signup/login validation errors inline under the field that failed (was one ambiguous message); verified in preview.

# Gecko voice
- [x] Fix speech endpoint crash when playback is stopped mid-request (abort now returns quietly instead of erroring); verified no overlay in the preview.

# Skillset dashboard
- [x] Record signed-in users' answer checks on bank problems and show an AREDL-style per-concept breakdown (correct/missed bars + accuracy) on the account page; verified end-to-end signed in.
- [x] Recommend bank problems at the bottom of the account page based on weakest concepts; excludes solved problems and refreshes live after answer checks; verified signed in (wrong answer keeps card, correct answer removes it and updates the graph).

# Problem bank difficulty
- [x] Show 1–5 star difficulty on every problem; all 12 bank problems rated, 1–5 range enforced in the database, star display verified in the preview.
- [x] Let users submit an answer on each problem card and see correct/try-again feedback; verified in the preview.
- [x] Add the same answer box below the gecko's hints on the homepage; verified correct/try-again against the gecko's answer. Box hides once the answer is revealed or all hints are out; verified.