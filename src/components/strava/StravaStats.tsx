import { Container, Grid, LinearProgress } from "@mui/material";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompleteAthlete } from "../../api/strava/models";
import { Strava } from "../../api/strava/StravaApi";
import { getAccessToken, hasValidToken } from "../../utils/UtilFunctions";
import StravaActivitiesTable from "./StravaActivitiesTable";
import StravaProfile from "./StravaProfile";

export default function StravaStats() {

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null)
    const [athlete, setAthlete] = useState<CompleteAthlete | null>(null);

    const navigate = useNavigate();
    if (!hasValidToken()) {
        navigate("/");
    }
    const token = getAccessToken()!;
    const strava = new Strava(token);

    useEffect(() => {
        async function fetchAthlete() {
            setLoading(true);
            setError(null);
            strava.getLoggedInAthlete()
                .then(function (a) {
                    strava.getAthleteStats(a.id)
                        .then(function (stats) {
                            setAthlete({
                                athlete: a,
                                athlete_stats: stats
                            });
                            setLoading(false);
                            setError(null);
                        })
                        .catch(function (error: AxiosError) {
                            setLoading(false);
                            setError(error.message);
                        });
                })
                .catch(function (error: AxiosError) {
                    setLoading(false);
                    setError(error.message);
                });
        }

        if (!athlete) {
            fetchAthlete();
        }
    }, [athlete]);

    return (
        <Container maxWidth="lg" disableGutters>
            {loading ?
                <Grid item xs={8}>
                    <LinearProgress />
                </Grid>
                :
                <div>
                    {error ?
                        <h1>{error}</h1>
                        :
                        <Grid container spacing={3}>
                            <Grid item xs={12}><StravaProfile complete_athlete={athlete!} /></Grid>
                            <Grid item xs={12}>
                                <StravaActivitiesTable strava={strava} complete_athlete={athlete!} />
                            </Grid>
                        </Grid>}
                </div>
            }
        </Container>
    );
}