# ShopLite Automation — Setup & Run

```
npm install
npx playwright test
```

No `playwright install` needed — config uses your system Chrome (`channel: 'chrome'`).

## Expected first run

Based on your TC-01 to TC-12 code review, expect roughly **9 of 12 to fail** initially:
TC-02, TC-03, TC-04, TC-05, TC-06, TC-07, TC-08, TC-09, TC-11, TC-12 assert correct/spec
behavior against a currently-buggy app. TC-01 and TC-10 should pass as-is.

Fix each bug in `shoplite-app.html`, re-run `npx playwright test`, and watch them flip green.

## CI

`.github/workflows/playwright.yml` is already set up, same pattern as your TaskFlow repo —
push this project to a new GitHub repo and it'll run automatically on every push/PR.
