import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Budgets from "../pages/Budgets";
import Reports from "../pages/Reports";
import Transactions from "../pages/Transactions";
import Wallet from "../pages/Wallet";

import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

import Layout from "../components/Layout"

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/*Rutele externe*/}
                <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />}/>
                    <Route path="/register" element={<Register />}/>
                </Route>

                {/*Rutele interne*/}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Navigate to="/transanctions" replace /> } />
                        <Route path="dashboard" element={<Dashboard />}/>
                        <Route path="wallet" element={<Wallet />}/>
                        <Route path="transactions" element={<Transactions />}/>
                        <Route path="transactions/:id" element={<Transactions />}/> 
                        <Route path="budgets" element={<Budgets />}/>
                        <Route path="reports" element={<Reports />}/>
                    </Route>
                </Route>

                {/*Rutele pagina inexistenta*/}
                <Route path="*" element={<div><h1>404- Pagina nu exista</h1></div>}/>

            </Routes>
        </BrowserRouter>
    )
}