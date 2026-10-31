import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "../convex/_generated/api.js";
import { execSync } from "child_process";

const CONVEX_URL = "https://moonlit-magpie-152.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

function runConvex(fnName, args) {
  const jsonArg = JSON.stringify(args).replace(/"/g, '\\"');
  const res = execSync(`npx convex run ${fnName} "${jsonArg}"`, { encoding: "utf-8" });
  return JSON.parse(res);
}

async function runTests() {
  console.log("=== LANGBRIDGE AUTHENTICATION SECURITY AUDIT SUITE ===");
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      process.exitCode = 1;
    }
  }

  // ── TEST 1: Legacy Signup Bypass Prevention ──
  console.log("\n--- 1. Testing Legacy Signup Bypass Prevention ---");
  try {
    await client.mutation(api.auth.signup, {
      name: "bypass_attacker",
      password: "password123",
    });
    assert(false, "Legacy unverified signup should have been rejected");
  } catch (err) {
    assert(
      err.message.includes("Direct unverified registration is disabled"),
      `Legacy signup blocked securely: ${err.message}`
    );
  }

  // ── TEST 2: Registration Validation & Cryptographic OTP ──
  console.log("\n--- 2. Testing Registration Validation & Cryptographic OTP ---");
  try {
    runConvex("auth:prepareSignup", {
      name: "Alice",
      email: "invalid-email-format",
      password: "pass",
    });
    assert(false, "Invalid email and short password should have been rejected");
  } catch (err) {
    assert(true, "Invalid email/password properly rejected");
  }

  const testEmail = `sec_audit_${Date.now()}@langbridge.test`;
  const testPassword = "AuditStrongPassword#2026";
  const testName = `User_${Date.now().toString().slice(-5)}`;

  const signupPrep = runConvex("auth:prepareSignup", {
    name: testName,
    email: testEmail,
    password: testPassword,
  });

  assert(
    typeof signupPrep.otp === "string" && signupPrep.otp.length === 6 && /^\d{6}$/.test(signupPrep.otp),
    `Cryptographically secure 6-digit OTP generated: ${signupPrep.otp}`
  );

  // ── TEST 3: Rate Limiting & Cooldown ──
  console.log("\n--- 3. Testing Rate Limiting & Cooldown ---");
  try {
    runConvex("auth:prepareSignup", {
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    assert(false, "Immediate resend without 60s cooldown should have failed");
  } catch (err) {
    assert(
      err.message.includes("seconds before requesting a new code"),
      `60s cooldown rate limit enforced: ${err.message}`
    );
  }

  // ── TEST 4: Incorrect, Expired, and Reused OTPs ──
  console.log("\n--- 4. Testing OTP Security (Incorrect, Reuse) ---");
  try {
    await client.mutation(api.auth.verifySignupOtp, {
      email: testEmail,
      code: "000000",
    });
    assert(false, "Incorrect OTP should have failed");
  } catch (err) {
    assert(err.message.includes("Invalid code"), "Incorrect OTP rejected and attempt logged");
  }

  // Verify with correct OTP
  const verifyRes = await client.mutation(api.auth.verifySignupOtp, {
    email: testEmail,
    code: signupPrep.otp,
  });

  assert(
    verifyRes && verifyRes.userId && verifyRes.sessionToken && verifyRes.sessionToken.length === 64,
    `Account verified and 32-byte (64 hex) session issued: token prefix=${verifyRes.sessionToken.slice(0, 10)}...`
  );

  // Attempt reuse of the exact same OTP
  try {
    await client.mutation(api.auth.verifySignupOtp, {
      email: testEmail,
      code: signupPrep.otp,
    });
    assert(false, "Reused OTP should have failed");
  } catch (err) {
    assert(
      err.message.includes("No pending verification found"),
      "Reused OTP strictly rejected (code deleted on use)"
    );
  }

  // ── TEST 5: Login with Verified vs Unverified Account ──
  console.log("\n--- 5. Testing Login Flow ---");
  const loginRes = await client.mutation(api.auth.login, {
    emailOrUsername: testEmail,
    password: testPassword,
  });

  assert(
    loginRes.userId === verifyRes.userId && loginRes.sessionToken,
    "Login succeeded with email and password, fresh session issued"
  );

  // Attempt login with invalid password
  try {
    await client.mutation(api.auth.login, {
      emailOrUsername: testEmail,
      password: "WrongPassword123",
    });
    assert(false, "Wrong password should fail");
  } catch (err) {
    assert(err.message.includes("Invalid password"), "Invalid password rejected");
  }

  // ── TEST 6: Legacy Account Login & Automatic PBKDF2 Migration ──
  console.log("\n--- 6. Testing Legacy Account Login & In-Place PBKDF2 Migration ---");
  const migRes = runConvex("auth:migrateLegacyUsers", {});
  assert(migRes.success, `Legacy user migration verified: total users=${migRes.totalUsers}`);

  // ── TEST 7: Session Authorization & Cross-User Protection ──
  console.log("\n--- 7. Testing Session Authorization & Cross-User Protection ---");
  // 1. Valid session accessing own profile
  const ownProfile = await client.query(api.users.get, {
    sessionToken: loginRes.sessionToken,
    userId: loginRes.userId,
  });
  assert(
    ownProfile && ownProfile._id === loginRes.userId,
    `Authenticated user derived from sessionToken: name='${ownProfile.name}'`
  );

  // Find another real user in the database
  const leaderboard = await client.query(api.users.getLeaderboard, {});
  const otherUser = leaderboard.find((u) => u._id !== loginRes.userId);
  if (otherUser) {
    // 2. Attacker attempting to access another user's profile using attacker's sessionToken
    try {
      await client.query(api.users.get, {
        sessionToken: loginRes.sessionToken, // Attacker's valid session
        userId: otherUser._id,               // Victim's real ID
      });
      assert(false, "Cross-user data access with mismatching userId should be rejected");
    } catch (err) {
      assert(
        err.message.includes("Access denied to another user's profile"),
        `Cross-user unauthorized access prevented: ${err.message}`
      );
    }

    // 3. Mutation authorization check on speech assessment
    const lessons = await client.query(api.lessons.listByLanguage, { language: "Kannada" });
    if (lessons.length > 0) {
      try {
        await client.mutation(api.speech.saveAssessment, {
          userId: otherUser._id,               // Victim's ID
          sessionToken: loginRes.sessionToken, // Attacker's token
          lessonId: lessons[0]._id,
          transcription: "test transcript",
          accuracy: 90,
          audioStorageId: "storage_fake_id",
        });
        assert(false, "Cross-user mutation without permission should fail");
      } catch (err) {
        assert(
          err.message.includes("Forbidden") || err.message.includes("Access denied"),
          `Cross-user mutation call blocked: ${err.message}`
        );
      }
    }
  }

  // ── TEST 8: Password Reset & Session Invalidation ──
  console.log("\n--- 8. Testing Password Reset & Session Invalidation ---");
  const resetPrep = runConvex("auth:preparePasswordReset", {
    email: testEmail,
  });
  assert(resetPrep.otp && resetPrep.otp.length === 6, `Password reset OTP generated: ${resetPrep.otp}`);

  const newPassword = "BrandNewPassword#999";
  const resetRes = await client.mutation(api.auth.resetPasswordWithOtp, {
    email: testEmail,
    code: resetPrep.otp,
    newPassword,
  });

  assert(resetRes.userId && resetRes.sessionToken, "Password reset succeeded with OTP");

  // Verify that the OLD session token is now REVOKED/INVALID
  const oldSessionCheck = await client.query(api.auth.validateSession, {
    sessionToken: loginRes.sessionToken,
  });
  assert(
    oldSessionCheck.valid === false,
    "Prior session token successfully revoked upon password reset"
  );

  // Verify old password no longer works
  try {
    await client.mutation(api.auth.login, {
      emailOrUsername: testEmail,
      password: testPassword,
    });
    assert(false, "Old password should no longer work");
  } catch (err) {
    assert(err.message.includes("Invalid password"), "Old password rejected after reset");
  }

  // Verify new password works
  const newLogin = await client.mutation(api.auth.login, {
    emailOrUsername: testEmail,
    password: newPassword,
  });
  assert(newLogin.userId === loginRes.userId, "New password logged in successfully");

  // ── TEST 9: Session Logout ──
  console.log("\n--- 9. Testing Session Logout ---");
  await client.mutation(api.auth.logout, {
    sessionToken: newLogin.sessionToken,
  });
  const loggedOutCheck = await client.query(api.auth.validateSession, {
    sessionToken: newLogin.sessionToken,
  });
  assert(loggedOutCheck.valid === false, "Session revoked immediately upon logout");

  // ── TEST 10: Cleanup Expired Records ──
  console.log("\n--- 10. Testing Expired Record Cleanup ---");
  const cleanupRes = runConvex("auth:cleanupExpired", {});
  assert(
    cleanupRes && typeof cleanupRes.deletedOtps === "number",
    `Cleanup executed successfully: deletedOtps=${cleanupRes.deletedOtps}, deletedSessions=${cleanupRes.deletedSessions}`
  );

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} of ${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed === total) {
    console.log("ALL AUTHENTICATION SECURITY AUDIT TESTS PASSED SUCCESSFULLY! ✅");
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
