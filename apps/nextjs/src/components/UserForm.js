import React, { useState } from 'react';

function UserForm({ onSubmit }) {
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workspaceName || !email) return;

    setLoading(true);
    const success = await onSubmit(email, workspaceName);
    setLoading(false);

    if (success) {
      setWorkspaceName('');
      setEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <input
          type="text"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="Enter workspace name"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          required
        />
        <button
          type="submit"
          className="action-btn"
          disabled={loading}
        >
          Login or Create
        </button>
        {loading && <div className="spinner visible"></div>}
      </div>
    </form>
  );
}

export default UserForm;