import { useLocation } from "react-router-dom";

export default function NotFound() {
    const location = useLocation();

    return <h1>
        404 NOT FOUND
        Page not found - the path, {location.pathname}, did not match
        any React Router routes.
    </h1>
}