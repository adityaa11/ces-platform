type DashboardWelcomeProps = { name: string };

export function DashboardWelcome({ name }: DashboardWelcomeProps) {
  return (
    <section aria-labelledby="admin-dashboard-welcome" className="admin-welcome-card">
      <div className="admin-welcome-inner">
        <p className="admin-welcome-kicker">Administration workspace</p>
        <h2 id="admin-dashboard-welcome">Welcome, {name}.</h2>
        <p>Welcome to the Atlas administration console.</p>
      </div>
    </section>
  );
}
