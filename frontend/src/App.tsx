import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Monitoramento from "./pages/Monitoramento";
import Dashboards from "./pages/Dashboards";
import Justificativas from "./pages/Justificativas";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/monitoramento" element={<Monitoramento />} />
        <Route path="/dashboards" element={<Dashboards />} />
        <Route path="/justificativas" element={<Justificativas />} />
      </Route>
    </Routes>
  );
}
