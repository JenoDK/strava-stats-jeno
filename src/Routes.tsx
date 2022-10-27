import { BrowserRouter, Route, Routes } from "react-router-dom";
import StravaRedirect from "./api/strava/StravaApi";
import Dashboard from "./components/Dashboard";
import NotFound from "./components/NotFound";
import { REACT_APP_BASE_PATH } from "./constants/StravaConstants";

export default ({ ...childProps }) =>
    <BrowserRouter>
        <Routes>
            <Route path={REACT_APP_BASE_PATH} element={<Dashboard />} />
            <Route path={REACT_APP_BASE_PATH + "redirect/*"} element={<StravaRedirect />} />
            <Route path={REACT_APP_BASE_PATH + "*"} element={<NotFound/>} />
        </Routes>
    </BrowserRouter>;

