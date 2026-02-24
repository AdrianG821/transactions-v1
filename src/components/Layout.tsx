import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Layout() {

    const navigate = useNavigate();
    const { logout } = useAuth()

    function handleLogout(e?: React.MouseEvent) {
    e?.preventDefault();
    logout()
    navigate("/login", { replace: true });
     }

    return (
        <div>
            <nav className="navbar-layout">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/transactions">Transactions</Link>
              <Link to="/budgets">Budgets</Link> 
              <Link to="/reports">Reports</Link> 
              <Link to="/wallet">Wallet</Link> 
              <Link to="/">   {logout.name}     </Link> 
              <button type="button" onClick={handleLogout}>Logout</button>
              <main style={{ padding: 16 }}>
                 <Outlet />
                </main>
            </nav>
        </div>
    )
}