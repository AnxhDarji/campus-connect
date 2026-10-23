/**
 * testChatbot.js
 * Comprehensive automated test suite for CampusConnect AI Chatbot
 */

import http from "http";

function postChat(data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: "localhost",
        port: 5001,
        path: "/api/chat",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("Starting CampusConnect AI Chatbot Automated Tests");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = "") => {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} - ${details}`);
      failed++;
    }
  };

  // Test 1: Empty message validation
  console.log("Test 1: Validating empty message rejection...");
  const t1 = await postChat({ message: "   " });
  assert(
    t1.status === 400 && t1.data?.success === false,
    "Empty message rejected with status 400",
    JSON.stringify(t1)
  );

  // Test 2: Message length validation (> 500 chars)
  console.log("\nTest 2: Validating message length rejection (> 500 chars)...");
  const longMsg = "a".repeat(501);
  const t2 = await postChat({ message: longMsg });
  assert(
    t2.status === 400 && t2.data?.success === false,
    "Over-length message rejected with status 400",
    JSON.stringify(t2)
  );

  // Test 3: Natural language question - Pharmacy student event recommendation
  console.log("\nTest 3: Pharmacy student recommendation...");
  const t3 = await postChat({
    message: "Which upcoming event would be most useful for a Pharmacy student?",
  });
  assert(
    t3.status === 200 &&
      t3.data?.success === true &&
      t3.data?.reply &&
      t3.data.reply.toLowerCase().includes("qwertyui"),
    "Recommends 'qwertyui' event targeted to RPCP Pharmacy student",
    t3.data?.reply?.slice(0, 150)
  );

  // Test 4: Follow-up question - Registration link retrieval
  console.log("\nTest 4: Follow-up question about registration...");
  const t4 = await postChat({
    message: "How can I register for this event?",
    history: [
      { role: "user", content: "Which upcoming event would be most useful for a Pharmacy student?" },
      { role: "assistant", content: "You should look into **qwertyui** (Workshop)." },
    ],
  });
  assert(
    t4.status === 200 &&
      t4.data?.success === true &&
      t4.data.reply.includes("google.com"),
    "Returns real registration link (https://google.com) from event data",
    t4.data?.reply?.slice(0, 150)
  );

  // Test 5: Date filter - Events in next 3 days
  console.log("\nTest 5: Relative date query ('within next 3 days')...");
  const t5 = await postChat({
    message: "Are there any tech events happening within the next 3 days?",
  });
  assert(
    t5.status === 200 &&
      t5.data?.success === true &&
      t5.data.reply.length > 10,
    "Responds to relative date filter without error",
    t5.data?.reply?.slice(0, 150)
  );

  // Test 6: Security - Verify no API key leaked in response
  console.log("\nTest 6: Verifying server response never leaks API keys...");
  const payloadStr = JSON.stringify([t1, t2, t3, t4, t5]);
  assert(
    !payloadStr.includes("AIzaSy"),
    "Response payloads do not contain Google API key tokens"
  );

  console.log("\n==================================================");
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
