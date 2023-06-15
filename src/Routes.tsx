import { BrowserRouter, Route, Routes } from "react-router-dom";
import StravaRedirect from "./api/strava/StravaApi";
import Dashboard from "./components/Dashboard";
import NotFound from "./components/NotFound";

export default ({ ...childProps }) =>
    <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="redirect/*" element={<StravaRedirect />} />
            <Route path="*" element={<NotFound/>} />
        </Routes>
    </BrowserRouter>;

