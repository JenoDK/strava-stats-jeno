import { Avatar, Container, Typography } from "@mui/material";
import { CompleteAthlete } from "../../api/strava/models";

interface StravaProfileProps {
    complete_athlete: CompleteAthlete
}

export default function StravaProfile(props: StravaProfileProps) {

    return (
        <Container maxWidth="lg" disableGutters>
            <Avatar alt="profile picture" src={props.complete_athlete.athlete.profile_medium} />
            <Typography
                variant="h6"
                noWrap
                sx={{
                    fontWeight: 700,
                    color: 'inherit',
                    textDecoration: 'none',
                }}
            >
                {props.complete_athlete.athlete.firstname} {props.complete_athlete.athlete.lastname}
            </Typography>
        </Container>
    );
}