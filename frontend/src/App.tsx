import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import CreatePayroll from './pages/CreatePayroll';
import PayrollDetail from './pages/PayrollDetail';
import Transactions from './pages/Transactions';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/payrolls/new" element={<CreatePayroll />} />
          <Route path="/payrolls/:id" element={<PayrollDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
