import { useState } from 'react';
import { api } from './store';

export function App() {
  const [userId, setUserId] = useState(1);
  const [newUserName, setNewUserName] = useState('');
  const [updateName, setUpdateName] = useState('');

  // Test basic query
  const { data: user, isLoading: userLoading, error: userError } =
    api.useGetUserByIdQuery({ id: userId });

  // Test query without input
  const { data: users, isLoading: usersLoading } =
    api.useListUsersQuery();

  // Test nested query
  const { data: nestedMessage } =
    api.useNested_GetMessageQuery();

  // Test deeply nested query
  const { data: deepMessage } =
    api.useNested_Deep_GetVeryNestedMessageQuery();

  // Test nested query with input
  const { data: echoData } =
    api.useNested_Deep_EchoQuery({ text: 'Hello E2E' });

  // Test post query
  const { data: post } =
    api.usePosts_GetByIdQuery({ id: 1 });

  // Test mutations
  const [createUser, { isLoading: creating }] =
    api.useCreateUserMutation();

  const [updateUserName, { isLoading: updating }] =
    api.useUpdateUserNameMutation();

  const [createPost] =
    api.usePosts_CreateMutation();

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return;
    try {
      await createUser({ name: newUserName }).unwrap();
      setNewUserName('');
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleUpdateUser = async () => {
    if (!updateName.trim()) return;
    try {
      await updateUserName({ id: userId, name: updateName }).unwrap();
      setUpdateName('');
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleCreatePost = async () => {
    try {
      await createPost({ title: 'Test Post', content: 'Test Content' }).unwrap();
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 data-testid="app-title">tRPC RTK Query E2E Test</h1>

      {/* User Query Section */}
      <section data-testid="user-section">
        <h2>Get User By ID</h2>
        <div>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(Number(e.target.value))}
            data-testid="user-id-input"
          />
        </div>
        {userLoading && <div data-testid="user-loading">Loading user...</div>}
        {userError && <div data-testid="user-error">Error loading user</div>}
        {user && (
          <div data-testid="user-data">
            <p>ID: <span data-testid="user-id">{user.id}</span></p>
            <p>Name: <span data-testid="user-name">{user.name}</span></p>
          </div>
        )}
      </section>

      {/* List Users Section */}
      <section data-testid="users-list-section">
        <h2>All Users</h2>
        {usersLoading && <div data-testid="users-loading">Loading users...</div>}
        {users && (
          <ul data-testid="users-list">
            {users.map((u: any) => (
              <li key={u.id} data-testid={`user-item-${u.id}`}>
                {u.id}: {u.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create User Section */}
      <section data-testid="create-user-section">
        <h2>Create User</h2>
        <input
          type="text"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
          placeholder="New user name"
          data-testid="new-user-input"
        />
        <button
          onClick={handleCreateUser}
          disabled={creating}
          data-testid="create-user-button"
        >
          {creating ? 'Creating...' : 'Create User'}
        </button>
      </section>

      {/* Update User Section */}
      <section data-testid="update-user-section">
        <h2>Update User Name</h2>
        <input
          type="text"
          value={updateName}
          onChange={(e) => setUpdateName(e.target.value)}
          placeholder="New name"
          data-testid="update-name-input"
        />
        <button
          onClick={handleUpdateUser}
          disabled={updating}
          data-testid="update-user-button"
        >
          {updating ? 'Updating...' : 'Update User'}
        </button>
      </section>

      {/* Nested Routes Section */}
      <section data-testid="nested-section">
        <h2>Nested Routes</h2>
        {nestedMessage && (
          <div data-testid="nested-message">
            {nestedMessage.message}
          </div>
        )}
        {deepMessage && (
          <div data-testid="deep-message">
            {deepMessage.message} (Level: {deepMessage.level})
          </div>
        )}
        {echoData && (
          <div data-testid="echo-message">
            Echo: {echoData.echo}
          </div>
        )}
      </section>

      {/* Posts Section */}
      <section data-testid="posts-section">
        <h2>Posts</h2>
        {post && (
          <div data-testid="post-data">
            <p>Post ID: <span data-testid="post-id">{post.id}</span></p>
            <p>Title: <span data-testid="post-title">{post.title}</span></p>
          </div>
        )}
        <button
          onClick={handleCreatePost}
          data-testid="create-post-button"
        >
          Create Post
        </button>
      </section>
    </div>
  );
}
