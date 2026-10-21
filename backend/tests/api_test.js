import assert from 'assert';

const BASE = 'http://localhost:4000/api/v1';

async function runTests() {
  console.log('🧪 Starting LangkahKecil API Integration Tests...\n');

  // 1. Register test
  const uniqueName = 'user_' + Date.now();
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `${uniqueName}@example.com`,
      username: uniqueName.slice(0, 15),
      display_name: 'Dinda Tester',
      password: 'LangkahKecil1',
    }),
  });
  const regData = await regRes.json();
  assert.strictEqual(regRes.status, 201, 'Register status should be 201');
  assert.ok(regData.data.access_token, 'Should return access_token');
  console.log('✅ 1. Register: Success');

  const token = regData.data.access_token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Get Me
  const meRes = await fetch(`${BASE}/users/me`, { headers: authHeaders });
  const meData = await meRes.json();
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meData.data.user.display_name, 'Dinda Tester');
  console.log('✅ 2. GET /users/me: Success');

  // 3. Create Habit
  const habitRes = await fetch(`${BASE}/habits`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Baca 1 halaman buku',
      anchor_cue: 'Setelah menyikat gigi malam',
      emoji: '📖',
      color: '#6366F1',
    }),
  });
  const habitData = await habitRes.json();
  assert.strictEqual(habitRes.status, 201);
  const habitId = habitData.data.habit.id;
  assert.strictEqual(habitData.data.habit.streak.current_streak, 0);
  console.log('✅ 3. POST /habits: Created habit ID', habitId);

  // 4. Today Dashboard
  const dashRes = await fetch(`${BASE}/dashboard/today`, { headers: authHeaders });
  const dashData = await dashRes.json();
  assert.strictEqual(dashRes.status, 200);
  assert.strictEqual(dashData.data.progress.total, 1);
  assert.strictEqual(dashData.data.progress.completed, 0);
  console.log('✅ 4. GET /dashboard/today: Verified');

  // 5. Check-in (Habit Log)
  const logRes = await fetch(`${BASE}/habits/${habitId}/logs`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ note: 'Baca 1 halaman selesai, ringan sekali!' }),
  });
  const logData = await logRes.json();
  assert.strictEqual(logRes.status, 201);
  assert.strictEqual(logData.data.streak.current_streak, 1);
  console.log('✅ 5. POST /habits/:id/logs (Check-in): Streak is now 1');

  // 6. Duplicate Check-in should fail with 409 ALREADY_LOGGED
  const dupRes = await fetch(`${BASE}/habits/${habitId}/logs`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ note: 'Coba log lagi' }),
  });
  const dupData = await dupRes.json();
  assert.strictEqual(dupRes.status, 409);
  assert.strictEqual(dupData.error.code, 'ALREADY_LOGGED');
  console.log('✅ 6. Duplicate check-in returned 409 ALREADY_LOGGED as expected');

  // 7. Create Post (Daily Win)
  const postRes = await fetch(`${BASE}/posts`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      body: 'Hari ini berhasil baca 1 halaman buku! Rasanya mulai terbiasa 🎉',
      post_type: 'daily_win',
      habit_id: habitId,
    }),
  });
  const postData = await postRes.json();
  assert.strictEqual(postRes.status, 201);
  const postId = postData.data.post.id;
  assert.strictEqual(postData.data.post.streak_snapshot, 1);
  console.log('✅ 7. POST /posts: Created post ID', postId, 'with streak snapshot');

  // 8. Put Reaction
  const reactRes = await fetch(`${BASE}/posts/${postId}/reaction`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ type: 'cheer' }),
  });
  const reactData = await reactRes.json();
  assert.strictEqual(reactRes.status, 200);
  assert.strictEqual(reactData.data.my_reaction, 'cheer');
  assert.strictEqual(reactData.data.reaction_count, 1);
  console.log('✅ 8. PUT /posts/:id/reaction: Cheer reacted');

  // 9. Add Comment
  const commentRes = await fetch(`${BASE}/posts/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ body: 'Keren banget, semangat terus ya!' }),
  });
  const commentData = await commentRes.json();
  assert.strictEqual(commentRes.status, 201);
  console.log('✅ 9. POST /posts/:id/comments: Comment posted');

  // 10. Get Feed
  const feedRes = await fetch(`${BASE}/posts?limit=5`, { headers: authHeaders });
  const feedData = await feedRes.json();
  assert.strictEqual(feedRes.status, 200);
  const foundPost = feedData.data.posts.find((p) => p.id === postId);
  assert.ok(foundPost);
  assert.strictEqual(foundPost.reaction_count, 1);
  assert.strictEqual(foundPost.comment_count, 1);
  assert.strictEqual(foundPost.my_reaction, 'cheer');
  console.log('✅ 10. GET /posts: Feed returned post with correct counts and my_reaction');

  console.log('\n🎉 ALL 10 BACKEND INTEGRATION TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
