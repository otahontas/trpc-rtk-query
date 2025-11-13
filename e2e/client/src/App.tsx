import { useState } from 'react';
import { api } from './store.js';

export function App() {
  const [userId, setUserId] = useState(1);
  const [newUserName, setNewUserName] = useState('');
  const [updateNameText, setUpdateNameText] = useState('');

  // Test basic query with primitive input (matching test fixtures pattern)
  const { data: user, isLoading: userLoading, error: userError } =
    api.useGetUserByIdQuery(userId);

  // Test query without input
  const { data: users, isLoading: usersLoading } =
    api.useListUsersQuery();

  // Test deeply nested query with input
  const { data: deepMessage } =
    api.useNested_Deep_GetVeryNestedMessageQuery({ deepInput: 'test' });

  // Test mutations
  const [createUser, { isLoading: creating }] =
    api.useCreateUserMutation();

  const [updateName, { isLoading: updating }] =
    api.useUpdateNameMutation();

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return;
    try {
      // Mutation with primitive string input
      await createUser(newUserName).unwrap();
      setNewUserName('');
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleUpdateUser = async () => {
    if (!updateNameText.trim()) return;
    try {
      // Mutation with object input
      await updateName({ id: userId, name: updateNameText }).unwrap();
      setUpdateNameText('');
    } catch (err) {
      console.error('Failed to update user:', err);
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
            onChange={(e) => setUserId(Number((e.target as HTMLInputElement).value))}
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
          onChange={(e) => setNewUserName((e.target as HTMLInputElement).value)}
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
          value={updateNameText}
          onChange={(e) => setUpdateNameText((e.target as HTMLInputElement).value)}
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
        {deepMessage && (
          <div data-testid="deep-message">
            {deepMessage.messageFromDeep} (Input: {deepMessage.inputBack})
          </div>
        )}
      </section>
    </div>
  );
}
