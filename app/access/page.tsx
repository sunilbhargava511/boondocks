'use client';

export default function AccessPage() {
  return (
    <div className="access-container">
      <div className="access-header">
        <h1 className="logo">Boondocks</h1>
        <h2>System Access Guide</h2>
      </div>

      <div className="access-content">
        <div className="portal-section">
          <div className="portal-card customer">
            <h3>🛍️ Customer Portal</h3>
            <p>For customers to book and manage appointments</p>
            <ul>
              <li>Create account or sign in</li>
              <li>View all your appointments</li>
              <li>Cancel or reschedule bookings</li>
              <li>Manage your profile</li>
            </ul>
            <div className="portal-buttons">
              <a href="/customers" className="portal-btn primary">Customer Login</a>
              <a href="/" className="portal-btn secondary">Quick Booking</a>
            </div>
          </div>

          <div className="portal-card provider">
            <h3>👤 Provider Portal</h3>
            <p>For barbers to manage their schedule</p>
            <ul>
              <li>View daily appointments</li>
              <li>Cancel or complete bookings</li>
              <li>Block unavailable dates</li>
              <li>See customer information</li>
            </ul>
            <div className="credentials">
              <strong>Login Credentials:</strong>
              <div>jan@boondocks.com / barber123</div>
              <div>dante@boondocks.com / barber123</div>
              <div>jenni@boondocks.com / barber123</div>
            </div>
            <a href="/providers" className="portal-btn provider">Provider Login</a>
          </div>

          <div className="portal-card admin">
            <h3>⚙️ Admin Dashboard</h3>
            <p>For shop owners and managers</p>
            <ul>
              <li>Manage providers and services</li>
              <li>View all customer data</li>
              <li>Configure system settings</li>
              <li>Import/export data</li>
              <li>SimplyBook sync controls</li>
            </ul>
            <div className="credentials">
              <strong>Admin Access:</strong>
              <div>Password required at login</div>
            </div>
            <a href="/admin" className="portal-btn admin">Admin Login</a>
          </div>
        </div>

        <div className="security-note">
          <h3>🔒 Security Features</h3>
          <ul>
            <li><strong>Role Separation</strong>: Providers cannot access admin functions</li>
            <li><strong>Data Isolation</strong>: Each provider sees only their own appointments</li>
            <li><strong>Secure Authentication</strong>: JWT tokens with password encryption</li>
            <li><strong>Local Data Storage</strong>: All data stored in your database first</li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        .access-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
          padding: 40px 20px;
        }

        .access-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo {
          font-family: 'Oswald', sans-serif;
          font-size: 48px;
          font-weight: 700;
          color: #c41e3a;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin: 0 0 8px 0;
        }

        .access-header h2 {
          color: #f5f5f0;
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }

        .access-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .portal-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        .portal-card {
          background: white;
          border: 3px solid #8b7355;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .portal-card.customer {
          border-color: #4caf50;
        }

        .portal-card.provider {
          border-color: #c41e3a;
        }

        .portal-card.admin {
          border-color: #ff9800;
        }

        .portal-card h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .portal-card p {
          color: #666;
          margin: 0 0 16px 0;
          font-size: 14px;
        }

        .portal-card ul {
          margin: 0 0 20px 0;
          padding-left: 20px;
        }

        .portal-card li {
          color: #444;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .credentials {
          background: #f8f8f8;
          padding: 12px;
          border-left: 3px solid #ccc;
          margin: 16px 0;
          font-size: 13px;
        }

        .credentials strong {
          display: block;
          margin-bottom: 8px;
          color: #333;
        }

        .credentials div {
          font-family: 'Courier New', monospace;
          color: #666;
          margin-bottom: 4px;
        }

        .portal-btn {
          display: inline-block;
          padding: 12px 24px;
          font-family: 'Oswald', sans-serif;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          color: white;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .portal-btn.primary {
          background: #4caf50;
        }

        .portal-btn.primary:hover {
          background: #45a049;
        }

        .portal-btn.provider {
          background: #c41e3a;
        }

        .portal-btn.provider:hover {
          background: #a01729;
        }

        .portal-btn.admin {
          background: #ff9800;
        }

        .portal-btn.admin:hover {
          background: #fb8c00;
        }

        .portal-btn.secondary {
          background: white;
          color: #4caf50;
          border: 2px solid #4caf50;
        }

        .portal-btn.secondary:hover {
          background: #f8f9fa;
        }

        .portal-buttons {
          display: flex;
          gap: 8px;
        }

        .portal-buttons .portal-btn {
          flex: 1;
          text-align: center;
        }

        .security-note {
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid #8b7355;
          padding: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .security-note h3 {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 16px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .security-note ul {
          margin: 0;
          padding-left: 20px;
        }

        .security-note li {
          color: #444;
          font-size: 14px;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .security-note strong {
          color: #c41e3a;
        }

        @media (max-width: 768px) {
          .portal-section {
            grid-template-columns: 1fr;
          }
          
          .portal-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}