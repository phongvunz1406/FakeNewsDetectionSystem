import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Analyze from "./pages/Analyze";
import About from "./pages/About";

export default function AppRouter() {
    const routes = [
        { path: "/", component: Home },
        { path: "/analyze", component: Analyze },
        { path: "/about", component: About }
    ];

    return (
        <Routes>
            {routes.map(({ path, component: Page }) => (
                <Route key={path} path={path} element={<Page />} />
            ))}
        </Routes>
    );
}