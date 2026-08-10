async function runTest() {
    const API_URL = "http://localhost:3000";
    const email = "test_test@test.com";

    try {
        console.log("1. Registering...");
        let res = await fetch(`${API_URL}/api/auth/register-send-code`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: email, password: "password123" })
        });
        let data = await res.json();
        console.log("Register:", data);

        // Instead of verify code, let's assume we can just login?
        // Wait, is there a bypass for verify code, or do we have to pull it from the database?
        // Let's just create the user directly in MongoDB if needed.
    } catch (e) {
        console.error(e);
    }
}
runTest();
