import { describe, test, expect } from "bun:test";
import { api, expectStatus } from "./helpers";

describe("API Integration Tests", () => {
  // Ports
  let portId: string;

  test("GET /api/ports - should return array of ports", async () => {
    const res = await api("/api/ports");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      portId = data[0].id;
    }
  });

  test("GET /api/ports with search parameter", async () => {
    const res = await api("/api/ports?search=test");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/ports/{id} - should return port details when exists", async () => {
    if (!portId) {
      return; // Skip if no ports exist
    }
    const res = await api(`/api/ports/${portId}`);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(portId);
    expect(data.name).toBeDefined();
  });

  test("GET /api/ports/{id} - should return 404 for nonexistent port", async () => {
    const res = await api("/api/ports/00000000-0000-0000-0000-000000000000");
    await expectStatus(res, 404);
  });

  // Presentations
  let presentationId: string;

  test("GET /api/presentations - should return array of presentations", async () => {
    const res = await api("/api/presentations");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      presentationId = data[0].id;
    }
  });

  test("GET /api/presentations with search parameter", async () => {
    const res = await api("/api/presentations?search=test");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/presentations/{id} - should return presentation details when exists", async () => {
    if (!presentationId) {
      return; // Skip if no presentations exist
    }
    const res = await api(`/api/presentations/${presentationId}`);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(presentationId);
    expect(data.title).toBeDefined();
  });

  test("GET /api/presentations/{id} - should return 404 for nonexistent presentation", async () => {
    const res = await api("/api/presentations/00000000-0000-0000-0000-000000000000");
    await expectStatus(res, 404);
  });

  // Floor Plan
  test("GET /api/floor-plan - should return floor plan data", async () => {
    const res = await api("/api/floor-plan");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.image_url).toBeDefined();
    expect(data.venue_notes).toBeDefined();
  });

  // Preferences
  const testEmail = "test-preference-user@example.com";

  test("GET /api/preferences/{email} - should return user preferences", async () => {
    const res = await api(`/api/preferences/${testEmail}`);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.email).toBe(testEmail);
    expect(typeof data.accept_messages).toBe("boolean");
  });

  test("PUT /api/preferences/{email} - should update user preferences", async () => {
    const res = await api(`/api/preferences/${testEmail}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accept_messages: true,
        show_email: false,
        show_phone: true,
        show_company: false,
        show_title: true,
      }),
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.email).toBe(testEmail);
    expect(data.accept_messages).toBe(true);
    expect(data.show_email).toBe(false);
  });

  // Conversations
  let conversationId: string;
  const participant1Email = "participant1@example.com";
  const participant2Email = "participant2@example.com";

  test("POST /api/conversations - should create conversation", async () => {
    const res = await api("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant1_email: participant1Email,
        participant2_email: participant2Email,
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    conversationId = data.id;
  });

  test("GET /api/conversations - should return conversations for user", async () => {
    const res = await api(`/api/conversations?email=${participant1Email}`);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/conversations/{id}/messages - should return messages array", async () => {
    if (!conversationId) {
      return; // Skip if conversation not created
    }
    const res = await api(`/api/conversations/${conversationId}/messages`);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("POST /api/conversations/{id}/messages - should send message", async () => {
    if (!conversationId) {
      return; // Skip if conversation not created
    }
    const res = await api(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_email: participant1Email,
        content: "Hello, this is a test message",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.conversation_id).toBe(conversationId);
  });

  test("GET /api/conversations/{id}/messages - should return 404 for nonexistent conversation", async () => {
    const res = await api(
      "/api/conversations/00000000-0000-0000-0000-000000000000/messages"
    );
    await expectStatus(res, 404);
  });

  // Networking
  test("GET /api/networking/attendees - should return array of attendees", async () => {
    const res = await api("/api/networking/attendees");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/networking/attendees with search parameter", async () => {
    const res = await api("/api/networking/attendees?search=test");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("GET /api/networking/attendees/{email} - should return attendee details when exists", async () => {
    const res = await api(`/api/networking/attendees/${participant1Email}`);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.email).toBe(participant1Email);
    expect(data.name).toBeDefined();
  });

  test("GET /api/networking/attendees/{email} with viewer_email parameter", async () => {
    const res = await api(
      `/api/networking/attendees/${participant1Email}?viewer_email=${participant2Email}`
    );
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.email).toBe(participant1Email);
  });

  test("GET /api/networking/attendees/{email} - should return 404 for nonexistent attendee", async () => {
    const res = await api(
      "/api/networking/attendees/nonexistent-user@example.com"
    );
    await expectStatus(res, 404);
  });

  // Attendees Directory
  test("GET /api/attendees-directory - should return attendees directory", async () => {
    const res = await api("/api/attendees-directory");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(typeof data).toBe("object");
    expect(data.attendees !== undefined || data.error !== undefined).toBe(true);
    if (data.attendees !== undefined) {
      expect(Array.isArray(data.attendees)).toBe(true);
    }
  });
});
